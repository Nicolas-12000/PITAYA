# PITAYA frontend

Dashboard de PITAYA en Next.js 16 (App Router, Cache Components + Partial Prerender), React 19, Tailwind CSS v4 y Recharts. Toda la analítica la calcula el backend (`/v1`); el cliente solo presenta.

## Inicio

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:8000
pnpm install
pnpm dev                     # http://localhost:3000
```

Con el backend en marcha (`make backend-dev` en la raíz) y el snapshot generado (`make ingest` + `make train`).

| Script | Qué hace |
|--------|----------|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm gen:api` | Regenera `lib/api/schema.ts` desde `${BACKEND_URL}/openapi.json` |

## Pantallas

| Ruta | Endpoints | Qué muestra |
|------|-----------|-------------|
| `/` | `kpis`, `roi`, `channels/compare`, `segments` | ROI protagonista, KPIs con mini barras por campaña, CPA por campaña, top 5 segmentos, FIG 0.1–0.3 |
| `/campaigns` | `segments`, `kpis` | Filtros en la URL, tabla ordenable con columnas ocultables, densidad, CSV y panel de detalle vs promedio |
| `/channels` | `channels/compare`, `segments` | Burbujas CPA × ROAS (campañas o segmentos, escala log) y ranking |
| `/roi` | `roi`, `channels/compare` | Sensibilidad al valor por conversión con punto de equilibrio |
| `/models` | `models` | Métricas CV/prueba, ROC-AUC por fold, Wilcoxon RF vs AdaBoost, nota de fuga |
| `/whatif` | `predict` | Probabilidad de convertir comparando los 5 modelos |
| `/ab` | `ab-test` | Veredicto con Holm, posteriores bayesianas, bootstrap del CPA, tamaño de muestra |
| `/attribution` | `attribution?model=` | Shapley real (nivel A) y 6 modelos multi-touch simulados (nivel B) |
| `/budget` | `recommendations` (GET/POST) | Reparto actual vs recomendado, guardado con `Idempotency-Key`, historial |
| `/status` | `status`, `health`, `models`, `admin/sync` | Persistencia, hashes, sondeo cada 15 s, sincronización, niveles L1–L3 |

## Estructura

```
app/
  (app)/                 # shell (sidebar, topbar, ⌘K) + 10 páginas con loading.tsx y _components/
  api/backend/[...path]  # proxy same-origin con lista de rutas permitidas
components/
  app/ ui/ data/ charts/ states/ notices/ illustrations/
lib/
  api/                   # schema.ts (generado), types.ts, server.ts, client.ts, errors.ts
  format.ts palette.ts labels.ts hooks/
```

- Datos: Server Components con `<Suspense>` por widget (`lib/api/server.ts`, nunca lanza: cada widget aísla su error). Mutaciones y sondeo con TanStack Query vía el proxy.
- `lib/api/types.ts` estrecha las respuestas que el backend publica como `dict[str, object]` sin `response_model`; los tipos de petición vienen del esquema generado.
- Tokens de diseño en `app/globals.css` (FRONTEND.md §4 y §8). Tipografía con utilidades `type-headline`, `type-kpi`, etc. (no `text-*`, para que `tailwind-merge` no las confunda con colores).
- Formato de números y fechas determinista (`lib/format.ts`) para evitar desajustes de hidratación entre el ICU de Node y el del navegador.

## Documentación

- **[FRONTEND.md](./FRONTEND.md)** — sistema de diseño, stack, pantallas e integración API.
- **[AGENTS.md](./AGENTS.md)** — reglas para agentes.
