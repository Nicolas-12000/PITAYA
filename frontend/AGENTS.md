<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del frontend de PITAYA

Guía completa: [FRONTEND.md](./FRONTEND.md) (diseño, tokens, pantallas). Contrato API: **sección 0** de ese documento.

- Next.js (App Router) + TypeScript estricto. `eslint`, `tsc --noEmit` y `pnpm build` en verde.
- Colores, radios y tipografía **solo** desde los tokens (`bg-canvas`, `text-ink`, `border-hairline`…). Prohibido hex y clases de color de Tailwind (`bg-blue-500`, etc.).
- Sin sombras en tarjetas, sin degradados y sin blur salvo en overlays.
- Un solo acento: `primary`. Colores de campaña fijos (916 `series-1`, 936 `series-2`, 1178 `series-5`).
- Tipos de la API solo desde `lib/api` (`pnpm gen:api`). No escribir tipos a mano.
- Server Components para datos; `'use client'` solo donde hay interacción.
- Toda carga tiene skeleton con la forma final; todo widget tiene estado vacío y de error.
- Todo número pasa por `lib/format.ts`; `null` se muestra como «—».
- Toda métrica con intervalo muestra el intervalo (si el backend lo envía). Datos simulados con `SimulatedBadge`; A/B entre campañas con `ObservationalNote`.
- Gráficos con el componente `chart` de shadcn (Recharts): máximo 4 series, etiqueta directa y vista como tabla.
- Sin librerías de UI o gráficos nuevas sin preguntar. Sin emojis ni texto con degradado.
- Textos al usuario en español (tuteo), técnicos y concretos; código en inglés.
- Cada componente se revisa en claro y oscuro, con teclado y con `prefers-reduced-motion`.
- Errores: toda llamada pasa por `lib/api` (`ApiError` y `toUserMessage`). Mensaje = qué pasó + qué hacer. Nunca limpiar un formulario al fallar. Cada widget aísla su propio error.
- Animación: primero CSS y `motion`; Lottie o Rive solo con `next/dynamic` y `ssr: false`. Prohibido el GIF dentro de la app (usar video o SVG). Respetar `prefers-reduced-motion`.
- Marca: usar `PitayaMark` con su mood; no recolorear ni deformar el logo. La mascota solo aparece en estados (vacío, error, éxito, arranque en frío).
- Proxy: rutas en `FRONTEND.md` §0.4 y §16 — incluir `v1/roi`, `v1/models`, `v1/health`, `GET v1/recommendations`. No usar `GET /v1/runs/latest` (no implementado).
