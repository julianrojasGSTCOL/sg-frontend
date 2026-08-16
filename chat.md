# Chatbot conversacional por contrato — diseño

Extiende la Fase 5 de [`plan.md`](./plan.md) (explicación IA de un solo turno vía GCAIS, ya implementada) hacia una conversación **multi-turno**: el ciudadano puede seguir preguntando sobre un contrato específico desde el frontend, no solo recibir una explicación de una sola vez.

## Contexto y hallazgos previos

Investigado en vivo contra la instancia real de GCAIS antes de diseñar esto:

- **Actualización**: el servicio `secop_guardian` ya cuenta (o va a contar) con un MCP propio que consulta la información de un contrato pasándole solo el **número de contrato** — eso reemplaza el envío de contexto embebido. Los mensajes que mandamos a GCAIS ya **no** necesitan traer el bloque completo (entidad, contratista, valor, señales, score) escrito a mano: solo necesitan mencionar el número de contrato como contexto (obligatorio según `gcais.md`) y dejar que el MCP resuelva el resto, incluido el análisis propio de SECOP Guardian (score/nivel de alerta/señales), consultando nuestra propia API.
  - Ese número de contrato se manda como una línea de contexto fija al inicio del mensaje (p.ej. `Contrato número: <numeroContrato>`). Como el ciudadano no debe ver esa etiqueta en la conversación, el backend la **parsea y la quita** antes de exponer el mensaje (`GET /contracts/:id/chat` y la respuesta de `POST /contracts/:id/chat` devuelven el texto ya limpio, sin la línea de contexto).
- GCAIS **sí mantiene memoria conversacional** dentro de un mismo `reference` (confirmado con una conversación real de 8+ turnos de otro servicio, en producción, sobre esta misma instancia, y luego con pruebas propias de varios turnos) — no hace falta reenviar todo el contexto del contrato en cada mensaje de seguimiento, y ahora tampoco hace falta reenviar el bloque de datos gracias al MCP.
- **El MCP agrega latencia real**: con el MCP resolviendo la tool-call (consultar el contrato), la respuesta de GCAIS tardó **~29-32s** en las pruebas contra el MCP real (`SG`, registrado para `secop_guardian`) — mucho más que los ~2s de cuando el contexto iba embebido a mano. El presupuesto de sondeo de `crearMensajeYEsperarRespuesta` se amplió de 8×1.5s (12s) a 25×2s (50s) para no devolver 502 en el camino feliz.
- `gcais.md` documenta `reference = gcais-<ip_cliente>-<id_contrato>`, pero se decidió **no usar la IP literal**: dos ciudadanos distintos preguntando por el mismo contrato desde la misma IP (oficina, NAT de celular) compartirían el mismo hilo y verían las preguntas del otro. En su lugar, el backend gestiona una **sesión anónima por cookie** (`_sgc_anon`, no es login, solo un identificador aleatorio), y esa sesión reemplaza la IP en la fórmula de `reference`.
- **Detalle crítico confirmado en vivo sobre la mutación de `reference`** (`POST /chats` le agrega un sufijo determinístico a la reference enviada, ver Fase 5 más arriba): reenviar una reference que YA vino mutada en una respuesta anterior hace que GCAIS la mute *de nuevo* (queda `...-undefined-undefined`, y sigue creciendo con cada reintento), rompiendo el hilo. La fórmula correcta es enviar **siempre** la reference original sin mutar (`gcais-<sesionId>-<contratoId>`) en cada `POST /chats`, turno tras turno — como la mutación es una función determinística del input, todos los mensajes con la misma reference de entrada terminan en el mismo hilo real. Para *leer* una conversación sin haber posteado antes (`GET /contracts/:id/chat`, o el chequeo de "¿ya existe conversación?" antes de mandar un mensaje) no se puede reconstruir la reference mutada a mano — se resuelve buscando el mensaje semilla por su `chat_name` (que GCAIS sí preserva tal cual), y de ahí se lee su `reference` real.

Esto implica migrar `/explain` (que hoy usa `request.ip`) a la misma sesión de cookie que usará el chat nuevo, para que ambos compartan el mismo hilo de conversación en GCAIS.

## Backend

### 1. Sesión anónima por cookie (nuevo módulo `common/session/`)

- `backend/src/common/session/sesion-anonima.service.ts` — `SesionAnonimaService.obtenerOCrearId(request, response): string`. Lee la cookie `_sgc_anon` parseando `request.headers.cookie` a mano (sin agregar `cookie-parser` como dependencia — es una sola cookie, no vale la pena la librería). Si no existe, genera un `crypto.randomUUID()` y lo setea vía `response.cookie('_sgc_anon', id, { httpOnly, sameSite: 'lax', secure: NODE_ENV==='production', maxAge: 180 días, path: '/' })` (nativo de Express, disponible por `@nestjs/platform-express`).
- `backend/src/common/session/sesion.module.ts` — módulo trivial, exporta el servicio.
- Se importa en `secop/secop.module.ts`.

### 2. Deduplicar el sondeo de respuesta en `GcaisService`

- `backend/src/ai/gcais.service.ts`: agregar `crearMensajeYEsperarRespuesta(datos: CrearMensajeGcais): Promise<GcaisChat | null>` que hace `crearMensaje` + el loop de sondeo (8 intentos / 1500ms) que hoy vive duplicado como método privado en `ExplicacionContratoService`.
- Nueva utilidad pura `backend/src/ai/gcais-chat.util.ts` con `ultimoMensaje(chats, role, despuesDeMs)` — reemplaza la lógica hoy privada `ultimaRespuestaAsistente`.
- `backend/src/ai/explicacion-contrato.service.ts`: se simplifica para llamar a `gcaisService.crearMensajeYEsperarRespuesta(...)` en vez de reimplementar el sondeo. Cambia su firma pública de `explicar(contrato, ipCliente)` a `explicar(contrato, sesionId)` — mismo parámetro, otro origen.

### 3. Resolución de conversación existente + servicio de chat multi-turno

`backend/src/ai/gcais-reference.util.ts`:

- `construirReferenciaChat(contratoId, sesionId)` — fórmula fija `gcais-<sesionId>-<contratoId>`, se manda **sin modificar** en cada `POST /chats`, turno tras turno (ver el detalle de la mutación en cascada más arriba).
- `construirChatNameSemilla(contratoId, sesionId)` — `chat_name` determinístico del primer mensaje de una conversación contrato+sesión (lo use `/explain` o `/chat`, lo que dispare primero).
- `construirChatNameTurno(contratoId, prefijo)` — `chat_name` único (`randomUUID()`) para turnos siguientes, no necesita ser reconstruible.

`backend/src/ai/conversacion-contrato.service.ts` — `ConversacionContratoService.resolverExistente(contratoId, sesionId)`: busca el mensaje semilla por `chat_name` (`buscarPorChatName`, no lo muta GCAIS) y, si existe, trae el hilo completo con `buscarPorReferencia(semilla.reference)`. Devuelve `null` si todavía no hay conversación. La usan tanto `ExplicacionContratoService` (para reusar una explicación ya generada en GCAIS) como `ChatContratoService` (para historial y para saber si hay que usar `chat_name` semilla o de turno). Esto sigue haciendo falta aunque el MCP ya resuelva el contenido — es pura mecánica de hilo/threading en GCAIS, no de contexto del contrato.

**Construcción de mensajes — simplificada por el MCP.** `backend/src/ai/contrato-contexto.util.ts` deja de exportar `construirBloqueContextoContrato` (el bloque completo con entidad/contratista/valor/señales ya no se embebe) y pasa a exportar:

- `construirContextoContrato(numeroContrato)` → `` `Contrato número: ${numeroContrato}` `` — línea fija de contexto obligatoria (`gcais.md`), primera línea de **todo** mensaje que mandamos (semilla o turno, `/explain` o `/chat`). El MCP la usa para resolver los datos y el análisis del contrato consultando nuestra propia API.
- `quitarContextoContrato(mensaje)` — quita esa primera línea (regex sobre `^Contrato número: .*\n+`) antes de devolver el texto al ciudadano. Se aplica en el mapeo `GcaisChat → MensajeChat` (`ChatContratoService.aMensajeChat`) y también donde se guarda `AnalisisContrato.explicacionIa`, para que nunca se muestre la etiqueta de contexto en la UI.
- `REGLAS_LENGUAJE_IA` se mantiene igual (sigue siendo responsabilidad de SECOP Guardian, no del MCP, que el modelo nunca acuse de corrupción) y se sigue mandando en cada mensaje.

`backend/src/ai/chat-contrato.service.ts` — `ChatContratoService`:

- `obtenerHistorial(contrato, sesionId): Promise<MensajeChat[]>` — `resolverExistente`; si no hay conversación, `[]`; si hay, ordena por fecha, mapea `role` → `rol` y aplica `quitarContextoContrato` a los mensajes de rol `ciudadano`.
- `enviarMensaje(contrato, sesionId, mensajeCiudadano): Promise<MensajeChat | null>` — `resolverExistente` primero, solo para decidir `chat_name` (semilla si no hay conversación previa, de turno si ya hay); el `message` es siempre `construirContextoContrato(numeroContrato) + '\n' + REGLAS_LENGUAJE_IA + '\n' + pregunta`, sin distinción de contenido entre primer turno y siguientes — el MCP resuelve el resto en ambos casos. Manda siempre `construirReferenciaChat(contrato.id, sesionId)` sin mutar (ver el detalle de la mutación en cascada más arriba).

`ExplicacionContratoService.construirPrompt` se simplifica igual: `construirContextoContrato(numeroContrato) + REGLAS_LENGUAJE_IA + instrucción de "explica por qué este contrato tiene señales de alerta"`, sin el bloque de datos.

### 4. Endpoints nuevos en `contracts.controller.ts`

Se agregan al controller existente:

- `GET /contracts/:id/chat` → 404 sin contrato, 400 sin `analisis`, si no `{ mensajes: MensajeChat[] }`.
- `POST /contracts/:id/chat` (body `EnviarMensajeChatDto { mensaje: string }`, `@IsString() @IsNotEmpty() @MaxLength(1000)`) → mismos 404/400, 502 si GCAIS no responde, si no `{ rol, mensaje, creadoEn }`.
- Ambos usan `@Req() request` + `@Res({ passthrough: true }) response` para pasarle a `SesionAnonimaService.obtenerOCrearId`.
- `explicar` (ya existente) se actualiza para usar `sesionId` (mismo mecanismo) en vez de `request.ip`.
- Nuevo DTO: `backend/src/secop/dto/enviar-mensaje-chat.dto.ts`.

### 5. Módulos

`ai.module.ts` agrega `ChatContratoService` a `providers`/`exports`. `secop.module.ts` importa el nuevo `SesionModule`.

### 6. `.env` / `.env.example`

No se necesitan variables nuevas — nombre de cookie y parámetros de sondeo quedan como constantes (mismo criterio que hoy).

## Frontend (diseño — pendiente de implementación)

### 1. Prerequisito bloqueante: API key en toda llamada

`frontend/utils/request.ts` debe agregar `Authorization: Bearer ${process.env.BACKEND_API_KEY}` de forma **incondicional** (nueva env var de servidor), sin tocar la semántica ya reservada de `token`/`includeCookies` (futuro login de ciudadano). El día que exista login de ciudadano, `Authorization` va a competir por los dos usos y el backend va a necesitar un header separado para el API key de servicio — no se resuelve en este diseño.

- Nuevo `frontend/.env.example` con `API_URL` y `BACKEND_API_KEY`.
- `frontend/.gitignore` ya tiene `.env*` (bloquea todo `.env*`) — agregar `!.env.example` para poder versionarlo.

### 2. Página de detalle de contrato

- `frontend/app/contracts/[id]/page.tsx` (nuevo) — Server Component puro: `await params`, llama `GET /contracts/:id` (vía `frontend/server/contracts/getContrato.ts`, sin tocar cookies), renderiza la ficha, monta `<ChatContrato>` pasándole `contratoId` y la `explicacionIa` ya cacheada si existe.

### 3. Widget de chat (Client Component + Server Actions)

Restricción de Next.js: `cookies().set()` (usado dentro de `saveCookies` en `request.ts`) solo puede llamarse desde un Server Action, no desde el render de un Server Component. Por eso **todo** lo que puede mintear/tocar `_sgc_anon` (explicación, historial, envío de mensaje) se dispara desde el Client Component, no desde `page.tsx`:

- `frontend/app/contracts/[id]/chat-contrato.tsx` (nuevo, `"use client"`) — estado de mensajes, input, "escribiendo…"; al montar carga historial vía Server Action (dentro de `startTransition`); botón "Generar explicación con IA" si todavía no hay una; envío de pregunta por Server Action.
- Server Actions nuevas, todas `"use server"`, mismo patrón (leen `_sgc_anon` de `cookies()`, la reenvían vía `requestHeaders: { Cookie: ... }` — genérico, sin tocar `request.ts` — y usan `saveCookies: true`):
  - `frontend/server/contracts/explicarContrato.ts`
  - `frontend/server/contracts/getChatHistorial.ts`
  - `frontend/server/contracts/enviarMensajeChat.ts`

### 4. Tipos nuevos

`frontend/types/contract.ts` (nuevo, no se toca `types/types.ts`): `ContratoDetalle` (espejo de `toContratoDetalle` del backend) y `MensajeChat`. Se mantienen sincronizados a mano con el backend, no hay generación automática entre los dos repos.

### 5. Mejora recomendada: preservar atributos de cookie en `saveCookies`

`request.ts` hoy solo persiste `nombre=valor` del `Set-Cookie` del backend y descarta `Max-Age/HttpOnly/SameSite` — efecto práctico: `_sgc_anon` llegaría como cookie de sesión (muere al cerrar el navegador), lo que le quita valor a tener una sesión anónima persistente. Conviene extender el parseo de `saveCookies` para pasar también esos atributos a `cookiesManager.set(nombre, valor, options)` — cambio pequeño, genérico (no hardcodeado a ninguna cookie en particular), beneficia también a las futuras cookies de auth.

## Verificación

**Backend (curl):**

1. Sin `Authorization` → 401 (el guard global sigue activo).
2. `POST /contracts/:id/explain` con `Cookie: _sgc_anon=s1` simulada → 201 con explicación que menciona datos reales del contrato (entidad, valor, señales) **sin que el prompt los haya incluido** — confirma que el MCP los resolvió a partir del número de contrato, no del contexto embebido.
3. `GET /contracts/:id/chat` con la misma cookie `s1` → el historial trae el intercambio del paso 2 (mismo `reference`), y el mensaje del rol `ciudadano` **no** muestra la línea `Contrato número: ...` (confirma que `quitarContextoContrato` la está limpiando).
4. `POST /contracts/:id/chat` con `s1`, pregunta que dependa de algo mencionado en el paso 2 sin repetirlo → confirma memoria conversacional real.
5. Mismo `GET /contracts/:id/chat` pero con `Cookie: _sgc_anon=s2` → historial vacío (confirma el aislamiento de sesión, el requisito central de este cambio).
6. Casos de error: uuid inexistente → 404, contrato sin análisis → 400, `mensaje` vacío → 400.
7. Revisar en los logs de GCAIS (o donde queden trazadas las tool-calls) que el MCP efectivamente se invocó — si el modelo responde con datos genéricos o inventados en vez de los reales del contrato, es señal de que no está resolviendo la tool-call y hay que revisar cómo está registrado el MCP para `secop_guardian`.

**Frontend (navegador, cuando se implemente):**

1. Abrir `/contracts/<uuid>` — ficha renderiza sin 401 en logs del backend (confirma que `BACKEND_API_KEY` viaja).
2. Click en "Generar explicación" si no hay una cacheada.
3. 2-3 preguntas seguidas en el chat — las respuestas reflejan contexto de preguntas anteriores.
4. DevTools → Application → Cookies: existe `_sgc_anon`.
5. Recargar la página completa y seguir preguntando algo dependiente del contexto previo — la sesión sobrevive al reload.
6. Misma URL en ventana de incógnito → chat vacío (sesión distinta).

## Fuera de alcance

- La colisión futura entre el header `Authorization` del API key de servicio y el futuro JWT de ciudadano.
- Rate-limiting/control de costo sobre los endpoints de chat (cada mensaje es una llamada real a OpenAI vía GCAIS, y ahora además dispara una tool-call del MCP) — vale la pena considerarlo antes de exponer esto públicamente.
- Qué pasa si el MCP falla o no encuentra el contrato por número (p.ej. `numeroContrato` no coincide exactamente con lo que espera el MCP) — no está cubierto por este diseño; si se observa en la verificación, hay que decidir un mensaje de fallback.
