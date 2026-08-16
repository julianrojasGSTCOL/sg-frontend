# Plan de implementación — SECOP Guardian (Backend)

Plan por fases para implementar el backend de SECOP Guardian (ver [`SECOP_Guardian.md`](./SECOP_Guardian.md)) sobre el scaffold NestJS existente en `backend/`.

## Decisiones de arquitectura

- **Motor de anomalías**: implementado en NestJS/TypeScript (no se crea un servicio Python separado). Todo el backend vive en un único servicio Nest.
- **ORM**: TypeORM sobre PostgreSQL.
- **Fuente de datos**: consulta en vivo a la API de Datos Abiertos de SECOP (Socrata/SODA), con persistencia local en Postgres a modo de caché/almacén operativo.

---

## Fase 0 — Setup base ✅

> Postgres: instancia local existente en `localhost:5432` (usuario `postgres`), base `secop_guardian` creada. `docker-compose.yml` queda como alternativa opcional, no es necesaria en este entorno.


- Instalar dependencias: `@nestjs/typeorm typeorm pg @nestjs/config @nestjs/axios axios class-validator class-transformer`
- `docker-compose.yml` con Postgres para desarrollo local
- `ConfigModule` global + `.env` con `DB_HOST/PORT/USER/PASSWORD/NAME`, `SECOP_API_BASE_URL`, `GCAIS_API_KEY`, `GCAIS_API_BASE_URL`
- `TypeOrmModule.forRootAsync` en `AppModule` usando `ConfigService`
- `ValidationPipe` global + `enableCors()` para el frontend (`localhost:8000`)
- Carpetas por dominio: `src/contracts`, `src/secop`, `src/anomaly`, `src/ai`, `src/dashboard`, `src/common`

## Fase 1 — Modelo de datos (TypeORM) ✅

> Entities creadas y verificadas contra Postgres (`entidades`, `contratistas`, `contratos`, `analisis_contratos`). Por ahora se usa `synchronize: true` en vez de migraciones formales (velocidad de hackathon); si se necesita reproducibilidad estricta más adelante, se puede generar la migración inicial con `typeorm migration:generate`.


- Entity `Entidad` (nombre, nit, etc.)
- Entity `Contratista` (nombre, identificación)
- Entity `Contrato`: `numero_contrato`, `entidad_id`, `contratista_id`, `objeto`, `valor`, `valor_inicial`, `fecha_firma`, `fecha_inicio`, `fecha_fin`, `duracion`, `tipo_contratacion`, `modalidad`, `estado`, `num_modificaciones`, `valor_adiciones`, `secop_id` (id original), `updated_at`
- Entity `AnalisisContrato`: `contrato_id`, `score`, `nivel_alerta`, `señales` (jsonb), `precio_promedio_comparable`, `precio_mediana_comparable`, `explicacion_ia`, `calculado_at` — caché del análisis
- Migraciones (`typeorm migration:generate/run`), índices en `numero_contrato`, `entidad_id`, `contratista_id`, `tipo_contratacion`

## Fase 2 — Ingesta SECOP ✅

> Dataset confirmado: **SECOP II - Contratos Electrónicos**, resource id `jbjy-vk9h` en datos.gov.co. Probado end-to-end contra la API real y Postgres local.
>
> **Hueco de datos conocido**: este dataset no expone valor monetario de adiciones ni conteo de modificaciones — solo `dias_adicionados` (días de prórroga). Se usa como proxy binario (`numModificaciones = 1` si hubo prórroga, si no `0`; `valorAdiciones` queda en `0`). Esto limita las reglas "Adiciones >20%" y "Varias modificaciones" de la Fase 3 hasta que se complemente con otro dataset o se ajuste la regla.

- `SecopModule` / `SecopClient`: construye queries SoQL contra la API Socrata de datos.gov.co
- **Tarea previa concreta**: confirmar el/los `resource id` exactos del dataset SECOP II a usar y los campos que trae
- Métodos: `buscarPorEntidad`, `buscarPorContratista`, `buscarPorNumeroContrato`, `buscarPorTipoContratacion` (con `$limit`/`$offset`)
- Mapper que limpia el JSON crudo → DTO interno (montos con separadores, fechas, vacíos → null)
- `IngestionService`: upsert de Entidad/Contratista/Contrato en Postgres al hacer una búsqueda nueva (evita duplicados por `numero_contrato + entidad`)
- Retry con backoff / timeout ante fallos de la API externa
- Caché corta (tabla o in-memory) para no repetir la misma consulta a Socrata en ventanas cortas

## Fase 3 — Motor de anomalías (reglas)

- `AnomalyModule` / `AnomalyScoringService`
- Conjunto comparable: contratos ya persistidos con mismo `tipo_contratacion` (opcionalmente misma entidad/rango de fechas)
- Estadística en TS (promedio, mediana, desviación estándar) — sin necesidad de Pandas
- Reglas (ver `SECOP_Guardian.md` sección 7), cada una activable/desactivable:
  - Precio anormal → +30
  - Adiciones >20% → +20
  - Varias modificaciones (≥3) → +15
  - Alta concentración del proveedor → +20
  - Comportamiento atípico general (z-score/IQR) → +15
- Mapeo score→nivel: 0-29 🟢, 30-59 🟡, 60-100 🔴
- Persistir en `AnalisisContrato` con lista de señales activadas
- Umbrales configurables por `.env` (para ajustarlos en caliente durante el hackathon)

## Fase 4 — API REST

- `GET /contracts/search?entidad=&contratista=&numero=&tipo=` → dispara ingesta si falta y devuelve lista con nivel de alerta
- `GET /contracts/:id` → ficha completa + señales
- `GET /dashboard?entidad=` → totales, bajo/medio/alto, valor total, promedio, mediana
- `GET /entities/search?q=` y `GET /contractors/search?q=` → autocompletar para el buscador
- DTOs con `class-validator`, paginación estándar, exception filters (404, 502 si falla SECOP)

## Fase 5 — Explicación con IA (vía GCAIS) ✅

> Cambio de diseño: la explicación en lenguaje natural ya no llama directo a la API de Anthropic. Se delega a **GCAIS** (ver [`gcais.md`](./gcais.md)), un servicio propio que gestiona chats con IA sobre `/api/chats`. `ANTHROPIC_API_KEY` queda obsoleta para este flujo; se usan `GCAIS_API_KEY`, `GCAIS_API_BASE_URL`, `GCAIS_SERVICE_ID` y `GCAIS_CLIENT` (en `backend/.env.example`).
>
> **Comportamiento real de GCAIS confirmado contra el servicio en vivo** (no documentado en `gcais.md`): `POST /api/chats` genera la respuesta del asistente de forma asíncrona pero rápida (~2s), consultable vía `GET /api/chats/reference/:reference` (se sondea con reintentos). Además, ese endpoint **reescribe la `reference` enviada** añadiéndole un sufijo (`-undefined` en este entorno) — por eso el cliente usa la `reference` que devuelve la respuesta del POST para el sondeo, y `chat_name` (que sí se preserva tal cual) como clave de reintento/idempotencia. Ya existe un servicio registrado en GCAIS para este proyecto: `service_id=f30efaa5-27ba-45b1-9f70-c3e06387b321`, `client=sg`, modelo `gpt-4o-mini`.

- `AiModule` / `GcaisService`: cliente HTTP (`HttpService`/axios) hacia `GCAIS_API_BASE_URL`, autenticado con `GCAIS_API_KEY` (Bearer)
- Validar `GCAIS_API_KEY` y `GCAIS_API_BASE_URL` al arrancar la app (falla rápido si faltan), tal como indica `gcais.md`
- Construcción del mensaje al crear una explicación (`POST /api/chats` en GCAIS):
  - `reference` obligatoria con formato `gcais-<ip_cliente>-<id_contrato>` — el id del contrato **siempre** va como contexto
  - `message`: prompt armado a partir de `AnalisisContrato.señales` + datos del contrato, respetando el lenguaje recomendado (`SECOP_Guardian.md` sección 13: "señal de alerta", "comportamiento atípico" — nunca "corrupción")
  - `role`, `sender_name`, `chat_name`, `service_id`/`service_name` según el contrato de `gcais.md` (definir el `service_id` fijo de SECOP Guardian registrado en GCAIS)
- Antes de crear un chat nuevo, consultar `GET /api/chats/reference/:reference` en GCAIS para reutilizar la conversación existente de ese contrato
- Endpoint propio `POST /contracts/:id/explain` (o incluido en la ficha) que internamente habla con GCAIS; cachea el texto resultante en `AnalisisContrato.explicacion_ia` para no volver a llamar a GCAIS en cada request
- Fallback: si GCAIS falla o no responde, mostrar señales sin narrativa (nunca bloquear la ficha del contrato)

## Fase 6 — Autenticación ✅

> Protección simple por API key compartida (no es auth de usuario final, es un gate a nivel de servicio) — pensado para que el frontend y cualquier otro consumidor autorizado incluyan el header, no para login de ciudadanos.

- `AuthModule` / `ApiKeyGuard`: valida que el header `Authorization: Bearer <token>` traiga exactamente el valor de la variable de entorno `API_KEY`, con comparación en tiempo constante (`crypto.timingSafeEqual`)
- Guard registrado globalmente vía `APP_GUARD`, protege **todas** las rutas de la aplicación sin excepciones
- Valida `API_KEY` al arrancar la app (falla rápido si falta), mismo patrón que `GcaisService`
- Consecuencia pendiente: `frontend/utils/request.ts` todavía no envía este header, así que las llamadas del frontend al backend fallarán con 401 hasta que se actualice para incluirlo

## Fase 7 — Transversales

- Logging en ingesta y scoring
- `GET /health`
- Seed script para precargar 1-2 entidades demo (evita depender de la red durante el pitch en vivo)

## Fase 8 — Testing

- Unit tests de `AnomalyScoringService` (precio normal/anómalo, adiciones, concentración)
- Unit tests del mapper SECOP con fixtures de JSON crudo
- e2e de `/contracts/search` y `/dashboard`

## Fase 9 — Preparación de demo

- Seed con la entidad elegida para el pitch, verificando que aparezcan los 3 niveles de alerta
- Confirmar shape de respuestas con quien haga el frontend
- Smoke test manual: buscar entidad → dashboard → ficha → explicación IA
