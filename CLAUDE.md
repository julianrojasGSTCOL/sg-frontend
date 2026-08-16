# CLAUDE.md

Este archivo le da guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

@AGENTS.md

## Proyecto

Frontend de SECOP Guardian — convierte datos públicos de contratación estatal
colombiana (SECOP) en señales de alerta ("bajo/medio/alto" riesgo) para
ciudadanos. Este repo (`sg-frontend`) es una app Next.js 16 (App Router)
emparejada con un repo hermano de API en NestJS (`sg-backend`, `../sg-backend`,
ver `sg-backend.code-workspace`). El MVP ya está conectado de punta a punta al
backend real: Dashboard (`/`), buscador de contratos (`/contratos`) y ficha de
contrato (`/contratos/[id]`).

Documentación de producto/backend presente en este repo (no es código, pero da
el contexto necesario para diseñar el frontend):
- `SECOP_Guardian.md` — spec de producto: funcionalidades del MVP (buscador,
  dashboard, sistema de alertas 🟢🟡🔴, ficha del contrato, explicación con
  IA), el sistema de puntuación de riesgo (0-29 bajo, 30-59 medio, 60-100
  alto), y el lenguaje recomendado para no sonar acusatorio ("señal de
  alerta", "comportamiento atípico", nunca "corrupción").
- `plan.md` — plan de implementación por fases del backend (`sg-backend`,
  NestJS + TypeORM + Postgres, ingesta en vivo desde la API SODA de
  datos.gov.co). Útil para saber qué endpoints esperar y en qué fase están:
  `GET /contracts/search`, `GET /contracts/:id`, `GET /dashboard`,
  `GET /entities/search`, `GET /contractors/search`,
  `POST /contracts/:id/explain`.
- `gcais.md` — describe **GCAIS**, un servicio NestJS externo/independiente
  que gestiona chats con IA y que alimenta la función "🤖 Explícame este
  contrato". Los mensajes se crean con `POST /api/chats` y deben llevar el id
  del contrato como contexto obligatorio dentro de `reference`, con el
  formato `gcais-<ip>-<id_contrato>`. Body relevante: `chat_name`,
  `service_id`, `message`, `role`, `sender_name`, `reference`, `client`
  opcional, `media` opcional (`{ mimetype, data }`). Autenticación vía
  `GCAIS_API_KEY` / `GCAIS_API_BASE_URL`.

Postgres local: el servicio activo en esta máquina escucha en el puerto
**5434**, no el 5432 que asume `sg-backend/.env.example` — el `.env` real del
backend (gitignored) ya tiene `DB_PORT=5434` corregido y el rol/DB
`secop_guardian` ya están creados. Si se reinstala Postgres o se corre en otra
máquina, verificar el puerto real (`Get-Service postgresql-*`) antes de asumir
5432.

## Comandos

El gestor de paquetes es **pnpm** (ver `packageManager` en package.json).

- `pnpm dev` — levanta el servidor de desarrollo en el puerto 8000 (no el 3000 por defecto de Next.js)
- `pnpm build` — build de producción
- `pnpm start` — corre el build de producción
- `pnpm lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

Todavía no hay un test runner configurado en este repo.

## Antes de escribir código

Este proyecto fija una versión de Next.js más reciente de lo que cubre la
mayoría de los datos de entrenamiento, con cambios que rompen APIs y
convenciones. Antes de tocar routing, layouts, data fetching o server
actions, revisa la documentación incluida en `node_modules/next/dist/docs/`
(docs de App Router bajo `01-app/`) en vez de confiar en conocimiento previo
de Next.js. Dos diferencias concretas ya presentes en este código:
- `app/layout.tsx` tipa sus props con el helper generado `LayoutProps<"/">`,
  no con un tipo escrito a mano como `{ children: React.ReactNode }`.
- `cookies()` (de `next/headers`) es async y debe usarse con `await` — ver
  `utils/request.ts`.

El bloque `<!-- BEGIN/END:nextjs-agent-rules -->` en `AGENTS.md` es
regenerado por `next dev` automáticamente; no lo edites a mano, y sí
inclúyelo en el commit si `next dev` lo vuelve a agregar al diff.

## Arquitectura

Capas, de abajo hacia arriba:

- `utils/request.ts` — el único cliente HTTP para hablar con el backend. Es
  una función `"use server"`, así que solo corre en el servidor. Lee
  `process.env.API_URL` y dos cookies de autenticación (`_sgc_actk` token de
  acceso, `_sgc_rftk` refresh token) vía `cookies()` de `next/headers`. Las
  opciones permiten enviar el bearer token (`token`), reenviar las cookies
  crudas (`includeCookies`), persistir las respuestas `Set-Cookie`
  (`saveCookies`), o borrar las cookies de auth (`deleteCookies`). El backend
  devuelve JSON crudo (sin envelope `{ data, success }`) y cuerpos de error
  con forma de NestJS (`{ statusCode, message, error }`); `request()`
  normaliza los errores lanzados a `Error` con el mensaje del backend y
  `cause` igual al status code (usar `cause === 404` para distinguir "no
  encontrado" de otros errores, como se hace en `app/contratos/[id]/page.tsx`).
  Ninguno de los endpoints actuales del backend requiere auth todavía, así que
  las llamadas en `server/*` no pasan `token`/`includeCookies`.
- `types/` — un archivo por dominio (`dashboard.ts`, `contrato.ts`), tipado a
  mano para que calce exactamente con lo que devuelven los controllers/DTOs de
  `sg-backend` (revisar ese repo si un endpoint cambia de forma). Si se le
  agrega un campo a un tipo de aquí que la ficha (`ContratoDetalle`) ya
  exponía pero el listado (`ContratoResumen`) no, hay que replicar el cambio
  en `sg-backend/src/contracts/mappers/contrato-presenter.ts` (p. ej.
  `estado` se agregó a `toContratoResumen` para poder mostrarlo en la tabla
  del buscador). `types/types.ts` solo define `ApiResponse<T>` (alias
  transparente de `T`, ya que el backend no tiene envelope `{ data, success }`).
- `server/<dominio>/<verbo><Recurso>.ts` — capa de acceso a datos: una función
  por endpoint del backend, construida sobre `utils/request.ts` (esto es la
  "Fase 3" mencionada en `plan.md`). Ningún componente llama a `request()`
  directamente; siempre pasa por aquí. Endpoints ya cubiertos:
  `getResumenDashboard` (`GET /dashboard`), `buscarContratos`
  (`GET /contracts/search`), `getFichaContrato` (`GET /contracts/:id`).
  `GET /entities/search` y `GET /contractors/search` (autocompletar) y
  `POST /contracts/:id/explain` (explicación con IA) existen en el backend o
  el plan pero todavía no tienen función ni UI en el frontend.
- `lib/` — helpers de presentación puros, sin I/O: `format.ts` (moneda COP,
  fechas `YYYY-MM-DD` → `DD/MM/YYYY` sin pasar por `Date` para evitar
  corrimientos de zona horaria) y `alerta.ts` (mapea `NivelAlerta` a
  emoji/etiqueta/clases Tailwind usando los tokens `alert-*` de
  `globals.css`).
- `components/ui/` — piezas genéricas reutilizables entre páginas
  (`AlertaBadge`, `ScoreMeter`, `StatCard`, `Paginacion`, `EstadoVacio`,
  `EstadoError`, `icons.tsx` con los SVG inline usados en el sidebar/tarjetas —
  no hay librería de íconos como dependencia). `components/layout/` tiene el
  chrome global montado una sola vez desde `app/layout.tsx`, en este orden:
  `TopNotice.tsx` (banda superior de ancho completo con el disclaimer
  "iniciativa ciudadana, no oficial" — ver nota de branding abajo, **nunca
  quitarla**) → `Sidebar.tsx` (nav fija a la izquierda, `hidden md:flex`,
  client component con `usePathname` para resaltar la ruta activa; ítem
  activo es una píldora sólida `bg-brand-500`) + `MobileNav.tsx` (mismo nav
  como barra superior, solo `md:hidden`, mismo par de rutas) → `Footer.tsx`
  (repite el disclaimer + atribución a datos.gov.co) al final de la columna
  de contenido. El layout con sidebar se probó, se descartó por un header
  institucional sin sidebar, y se **volvió a traer** — el histórico completo
  de esa ida y vuelta (y por qué) está más abajo en este archivo y no hace
  falta repetirlo; lo que importa es que la versión actual es con sidebar. El
  nav solo linkea a rutas que existen de verdad (`/` y `/contratos`); no se
  agregan ítems para páginas que no están construidas todavía.
  `components/dashboard/RiesgoBar.tsx` es la barra de distribución
  bajo/medio/alto del Dashboard. `components/contratos/` tiene lo específico
  del buscador (`FiltrosBusqueda`, `TablaContratos`).
- `app/` — tres rutas conectadas al backend real:
  - `app/page.tsx` — Dashboard, lee `searchParams.entidad` y llama a
    `getResumenDashboard`.
  - `app/contratos/page.tsx` — buscador; el formulario de filtros usa
    `next/form` con `action="/contratos"` (GET nativo, sin JS ni client
    component) para que enviar el form navegue con los filtros como query
    string; la página lee `searchParams` y llama a `buscarContratos` con
    paginación (`limit`/`offset`).
  - `app/contratos/[id]/page.tsx` — ficha; usa `notFound()` de
    `next/navigation` cuando `getFichaContrato` falla con `cause === 404`.

  Todas las páginas que llaman al backend envuelven la llamada en
  `try/catch` y renderizan `EstadoError`/`EstadoVacio` en vez de dejar que
  el error tumbe la página — así se degradan con gracia si `sg-backend` está
  caído (network error) sin mostrar la pantalla de error de Next.js.
- El estilado es Tailwind CSS v4 vía `@tailwindcss/postcss` (no hay archivo
  `tailwind.config.*` — el tema se define con custom properties de CSS y
  `@theme inline` en `app/globals.css`). La paleta parte de los valores
  **reales** de gov.co (`cdn.www.gov.co/layout/v4/all.css`, extraído por
  petición explícita del usuario de imitar look-and-feel de "servicio de
  gobierno"): los tokens de estado `#068460` (éxito), `#FFAB00`
  (advertencia), `#A80521` (error) para los niveles de alerta bajo/medio/alto
  se mantienen tal cual gov.co los define. El azul de marca, en cambio, se
  aclaró a pedido del usuario ("colores vivos, azul claro y blanco") —
  `brand-500` es un azul vivo más claro (`#2f7ff5`) que el `#3366CC`
  institucional original, y `--background` es un lavado de azul claro
  (`#e8f2ff`) en vez del gris `#F6F8F9` de gov.co, con las tarjetas (`.tarjeta`,
  `--surface`) en blanco puro sobre ese fondo — dos tonos, no una escala de
  grises pareja. Ninguno de estos hex está validado por contraste/daltonismo
  (no es el skill de dataviz de una iteración anterior); si hace falta
  retocar un tono, revisar a ojo en ambos temas. Regla de diseño que sí
  se mantiene de antes: **el color nunca va en el
  texto** (un valor o etiqueta se pinta siempre en `text-foreground`/
  `text-muted`; el nivel de alerta lo carga un punto, una barra de acento, o
  el relleno de `ScoreMeter` — nunca el color del texto mismo). Los fondos
  "suaves" (`alert-low-bg`, `brand-100`, `accent-100`) se calculan con
  `color-mix()` contra `--surface` en vez de hardcodearse por tema, así que
  **no hace falta un bloque `dark:` aparte para ellos** — ya se adaptan solos
  cuando cambia `--surface` en `@media (prefers-color-scheme: dark)`. A
  diferencia de la primera versión, los tres niveles de alerta **sí** se
  redefinen en el bloque oscuro (tonos más brillantes para que resalten sobre
  `--surface` oscuro), porque ya no son los hex mode-invariantes validados por
  el skill.
- **Tarjetas y botones — receta real de gov.co**: `.tarjeta` y `.entrada` en
  `globals.css` calcan `.tarjeta-govco`/`.icono-tarjeta-govco` y
  `.entradas-de-texto-govco input:focus` de su CSS real: sin sombra gris
  genérica de base, solo un borde `brand-100` (azul clarito); en hover/focus
  el borde pasa a `brand-500` y aparece un "resplandor" de color plano debajo
  (`box-shadow: 0 0.25rem 0 0 color-mix(...)`, sin blur) en vez de una sombra
  difusa — así se ve "menos plano" sin usar una sombra genérica tipo
  Bootstrap. Usar la clase `.tarjeta` (+ padding) para cualquier panel nuevo
  en vez de `rounded-xl border border-border bg-surface`. Los botones
  primarios también calcan el patrón real de `.btn-govco`: **`brand-500` es
  el color por defecto y `brand-700` el de hover** (se oscurece al pasar el
  mouse, no al revés) y siempre llevan `border-2 border-brand-500` visible
  aunque estén rellenos — si se agrega un botón primario nuevo, seguir ese
  mismo orden y no `brand-700` por defecto.
- **Branding**: SECOP Guardian es una herramienta ciudadana independiente, no
  un sitio oficial del Estado. Por pedido explícito del usuario la paleta se
  inspira/parte de la real de gov.co (ver arriba) — pero el logo (escudo
  propio, no el de Colombia/gov.co), el wordmark ("SECOP Guardian", no
  "GOV.CO") y la estructura del sidebar/nav son intencionalmente distintos, y
  el disclaimer en `TopNotice.tsx` (banda superior de ancho completo) +
  `Footer.tsx` es la mitigación central para que nadie confunda esto con un
  sitio gubernamental real — **nunca quitar ese disclaimer**, ni siquiera al
  retocar el diseño más a fondo.
- El alias de rutas `@/*` apunta a la raíz del repo (`tsconfig.json`), p. ej.
  `@/server/contratos/buscarContratos`, `@/types/contrato`.
- La conectividad con el backend requiere `API_URL` en el entorno. Hay un
  `.env.local` local (gitignored, no commiteado) con
  `API_URL=http://localhost:3000`, que es el puerto por defecto de
  `sg-backend` (`../sg-backend/.env.example`). Si cambia el puerto del
  backend, hay que actualizar ese archivo a mano.
- Después de agregar o renombrar una ruta bajo `app/`, correr
  `npx next typegen` (o simplemente `pnpm dev`) para regenerar
  `.next/types` — si no, TypeScript no reconoce literales nuevos como
  `PageProps<'/contratos'>`.
