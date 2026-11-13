# PITAYA UI: guía de frontend y sistema de diseño
Para quien construye el frontend en Next.js. Complementa la guía técnica de PITAYA (backend y arquitectura) y la usa como contexto: mismos nombres, mismos endpoints y mismas reglas de honestidad. Si dudas, elige lo más simple y sobrio.
Norte: una herramienta de análisis que se sienta hecha a mano: calma, densa, legible y rápida. Los datos son los protagonistas y el diseño es el marco.

## 0. Contrato con el backend (implementado)

Complementa la [guía técnica](../PITAYA.MD) y el [AGENTS.md](../AGENTS.md) del repositorio. **Fuente de verdad de rutas:** prefijo `/v1` en FastAPI (`backend/src/pitaya/platform/web/routes.py`). OpenAPI en `http://localhost:8000/docs` con `make backend-dev`.

### 0.1 Endpoints disponibles

| Método | Ruta | Uso en UI |
|--------|------|-----------|
| GET | `/v1/health` | Salud del servicio |
| GET | `/v1/status` | RunBadge, `/status`, modo `storage_mode`, snapshot, caché, persistencia |
| GET | `/v1/kpis` | Resumen (KPIs globales; valor ROI vía env en backend, no query `value`) |
| GET | `/v1/roi` | Página `/roi`: sensibilidad y break-even |
| GET | `/v1/models` | `/models`: manifiesto, métricas, Wilcoxon RF vs AdaBoost |
| GET | `/v1/segments` | `/campaigns` |
| GET | `/v1/channels/compare` | `/channels` |
| GET | `/v1/attribution?model=` | `/attribution` (`shapley` nivel A; otros modelos nivel B simulado) |
| POST | `/v1/predict` | `/whatif` (`scenario`: `prelaunch` \| `inflight`) |
| POST | `/v1/ab-test` | `/ab` (body: `campaign_ids` opcional) |
| POST | `/v1/recommendations` | `/budget` (header `Idempotency-Key`) |
| GET | `/v1/recommendations` | Historial en `/budget` |
| POST | `/v1/admin/sync` | Botón sincronizar en `/status` |

**No existe aún** `GET /v1/runs/latest`. Para la insignia del run usen `GET /v1/status` (`snapshot.dataset_hash`, `storage_mode`, etc.) y `GET /v1/models` (`generated_at`, hashes del manifiesto).

### 0.2 Diferencias respecto a la especificación UI (sección 11)

| Tema | Especificación UI | Backend hoy |
|------|-------------------|-------------|
| ROI sensible al valor | `GET /v1/kpis?value=` | `GET /v1/roi`; KPIs con `value_per_approved_conversion` en entorno |
| Bloque `run` unificado en cada JSON | `run_id`, `dataset_hash`, `mode`, `generated_at` | Campos repartidos en `/status`, manifiesto en `/models`; el cliente puede normalizar en `lib/run.ts` |
| Intervalos `ci_low` / `ci_high` en todas las métricas | Siempre visibles | A/B y partes de experimentos sí; muchos KPIs son punto estimado — mostrar «—» si faltan |
| Rutas App Router A/B y what-if | `/ab`, `/whatif` | Preferidas frente a la ruta legacy `/experiments` |

### 0.3 Honestidad y errores (alineado al backend)

- **503** si falta snapshot (`make train` / `make ingest`).
- **422** validación FastAPI → errores de campo en formularios.
- **409** en recomendaciones con misma `Idempotency-Key` y cuerpo distinto.
- Atribución con modelos sintéticos (no Shapley): marcar **Datos simulados** (`SimulatedBadge`).
- Comparación A/B entre campañas: **ObservationalNote** (no aleatorizado).

### 0.4 Proxy Next.js (lista actualizada — ver también sección 16)

Rutas permitidas en `app/api/backend/[...path]/route.ts`: `v1/health`, `v1/status`, `v1/kpis`, `v1/roi`, `v1/models`, `v1/segments`, `v1/channels/compare`, `v1/attribution`, `v1/predict`, `v1/ab-test`, `v1/recommendations`, `v1/admin/sync` (GET y POST según tabla 0.1).

### 0.5 Cliente y entorno

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:8000
pnpm gen:api                 # desde openapi.json del backend (cuando esté en el Makefile del frontend)
```

Misma cadena de calidad que el backend: CI en [README](../README.md#calidad-backend) (`make test`, ruff, mypy); el frontend debe pasar `pnpm lint`, `typecheck`, `test` y `build` (sección 18).

---


1. Principios de diseño
1.  Los datos primero. Cada pantalla responde una pregunta de negocio. El chrome es un marco discreto para gráficos y tablas, como las capturas de producto de Linear.
2.  Un solo acento. El magenta pitaya se usa para acciones, foco y selección. Los demás colores aparecen solo en datos y estados.
3.  Jerarquía por superficies y líneas finas, no por sombras, degradados ni brillos.
4.  Todo estado está diseñado: cargando (skeleton), vacío, error, parcial, desactualizado y simulado.
5.  Honestidad visible: la incertidumbre (intervalos), la etiqueta «observacional» y «Datos simulados» se ven en la interfaz, no en un pie de página.
6.  Densidad cómoda: más información que una landing y menos ruido que un dashboard de plantilla.
7.  Cada elemento se gana su lugar: si quitarlo no cambia lo que el usuario entiende o hace, se quita.
2. Cómo evitar el «look IA»
Evitar
En su lugar
Fondos con degradado morado-azul, orbes y brillos
Fondo plano (plum-black o crema) y un único acento
Glassmorphism y blur en cada tarjeta
Superficies sólidas con borde de 1 px; blur solo en el overlay de los diálogos
Sombras grandes y tarjetas flotantes
Sin sombras: la elevación la dan la superficie y la línea fina
Títulos con degradado de texto o con emojis
Geist 500/600 con tracking negativo, sin adornos
Un ícono en círculo de color en cada tarjeta
Íconos Lucide de trazo 1.5 solo donde ayudan a escanear
Grids bento de tarjetas idénticas
Una tarjeta protagonista por pantalla y el resto subordinado
Radios enormes en todo
8 px controles, 12 px paneles, 16 px marcos de gráficos; pill solo en badges y tabs
Animación de entrada en todo y contadores que suben
Movimiento solo para explicar un cambio; los gráficos se dibujan una vez
Copy genérico («desbloquea el poder de tus datos»)
Microcopy técnico y concreto, en español
Ilustraciones de stock o mockups falsos
Isométricos de línea propios (FIG 0.x) y capturas reales de la app
Números redondos inventados
Datos reales del snapshot; sin dato se muestra «—» con explicación
Spinner de pantalla completa
Skeletons con la forma exacta del contenido
3. Identidad: de dónde sale lo único
Referencia: el lenguaje de Linear (canvas casi negro, superficies escalonadas, líneas finas, un solo acento) y la lámina FIG 0.1 a 0.3 (isométricos de línea sobre fondo oscuro, etiquetas mono y columnas separadas por una línea vertical). Nuestro sello propio:
• Etiquetas FIG 0.x en mono, 11 px, mayúsculas y color ink-tertiary, sobre las ilustraciones y los paneles conceptuales.
• Tres isométricos de línea que cuentan el proyecto: capas (el pipeline: datos → modelos → decisiones), cubos (los módulos del monolito) y láminas (las escamas de la pitaya, que también sugieren segmentos y distribuciones).
• Un solo elemento en magenta por ilustración, para atar la figura al acento de la marca.
• Paneles de tres columnas separados por una línea vertical de 1 px, sin tarjetas con fondo.
• Números y etiquetas técnicas en mono tabular, que dan carácter de herramienta de ingeniería.
El logo y la mascota (una pitaya con carita, en SVG) están en la sección 20; las animaciones y dependencias de SVG y GIF, en la 21; el manejo de errores y reglas de agentes en la sección 19 (`frontend/AGENTS.md`); tokens en `app/globals.css` (sección 8).
4. Paleta: alusión a la fruta sin copiarla
La idea: la pitaya roja da el magenta; la pulpa blanca da el crema rosado del modo claro; las semillas dan el plum-black del modo oscuro; las escamas dan el verde hoja; la pitaya amarilla da el ámbar. Son colores parecidos y armoniosos, no literales.
4.1 Superficies, líneas, texto y acento
Token
Oscuro
Claro
Uso
canvas
#0A0709
#FCF8FA
Fondo de página
surface-1
#120C11
#FFFFFF
Tarjetas y paneles
surface-2
#181118
#F8F1F5
Hover, tabs, base del skeleton
surface-3
#1F161F
#F1E7ED
Popovers y tooltips
surface-4
#261B25
#EADDE5
Elementos elevados, brillo del skeleton
hairline
#2A1F29
#EADCE4
Bordes de 1 px
hairline-strong
#3A2C39
#D9C6D2
Separadores y bordes de énfasis
hairline-tertiary
#4A3948
#C7B0BF
Trazos secundarios de ilustración
ink
#F7F2F5
#1B1119
Texto principal
ink-muted
#D3C7CF
#55434F
Texto secundario
ink-subtle
#9A8A96
#7D6B77
Etiquetas y ejes
ink-tertiary
#6B5C68
#A29098
Deshabilitado y etiquetas FIG
primary
#C8327E
#C8327E
Botón primario y selección
primary-hover
#DB4A93
#B02B6F
Hover del primario
primary-pressed
#AD2A6C
#96245E
Pressed
primary-text
#F07DB3
#B3276F
Enlaces e íconos activos
primary-subtle
magenta al 14%
magenta al 10%
Fondo del ítem seleccionado
on-primary
#FFFFFF
#FFFFFF
Texto sobre primary
4.2 Series de datos y semántica
Token
Oscuro
Claro
Uso
series-1 magenta
#E0549A
#C8327E
Campaña 916, variante A
series-2 violeta
#9C86F5
#6E56CF
Campaña 936, variante B
series-3 verde hoja
#3DBE8B
#1F9A6B
Positivo (ROI > 0)
series-4 ámbar
#F2B84B
#B87A0A
Advertencia y datos simulados
series-5 turquesa
#3FB8C9
#1E8FA3
Campaña 1178, serie de apoyo
series-6 coral
#F0707F
#CF3D55
Negativo, error
success-ink
#3DBE8B
#14724F
Texto de éxito
warning-ink
#F2B84B
#7A4F00
Texto de advertencia
danger-ink
#F0707F
#A82A40
Texto de error
info-ink
#9C86F5
#5B44B8
Texto informativo
4.3 Reglas de uso del color
• Magenta = acción y selección. Nunca como fondo de sección ni decoración.
• Colores de campaña estables en todas las pantallas: 916 magenta, 936 violeta, 1178 turquesa. El verde y el coral quedan reservados para bueno y malo, para que no se confundan con campañas.
• Datos simulados = ámbar con borde punteado en todo panel o gráfico que los contenga.
• Máximo 4 series por gráfico. Además del color se usa forma, trazo discontinuo o etiqueta directa, para que sea legible con daltonismo.
• Rampas: secuencial de surface-2 a primary; divergente de series-6 a series-3 pasando por el neutro.
• Contraste: el blanco sobre primary da cerca de 5:1; el texto de enlaces usa primary-text, no primary. Verifiquen todos los pares con un verificador de contraste (objetivo AA) en ambos modos.
5. Tipografía
Geist Sans para interfaz y titulares, y Geist Mono para números, etiquetas FIG y código, ambas con next/font (sin parpadeo ni salto de layout). Los números usan siempre font-variant-numeric: tabular-nums.
Estilo
Fuente
Tamaño / interlineado
Peso
Tracking
Uso
display
Sans
48 / 1.08
600
-1.6 px
Solo onboarding y 404
headline
Sans
28 / 1.2
600
-0.6 px
Título de página
title
Sans
20 / 1.3
500
-0.3 px
Título de panel
kpi
Sans
36 / 1.0
500
-1.0 px
Valor de las tarjetas KPI
body
Sans
15 / 1.55
400
-0.1 px
Texto general
body-sm
Sans
13 / 1.5
400
0
Tablas y descripciones
caption
Sans
12 / 1.4
400
0
Notas y ejes
label-mono
Mono
11 / 1.3
500
+0.08 em, mayúsculas
FIG 0.x y etiquetas técnicas
num-mono
Mono
13 / 1.4
400
0
Hashes, ids y valores en tablas
Reglas: máximo dos pesos por pantalla (400 y 500; el 600 solo en titulares), sin texto con degradado y sin mayúsculas sostenidas fuera de las etiquetas mono.
6. Layout, espaciado y forma
Aspecto
Regla
Espaciado
Base de 4 px: 4, 8, 12, 16, 24, 32, 48, 64, 96
Radios
6 px chips y checkboxes, 8 px botones e inputs, 12 px paneles y tarjetas, 16 px marcos de gráficos, pill en badges y tabs
Bordes
1 px hairline en todas las superficies; hairline-strong en foco, hover y separadores
Elevación
Sin sombras en tarjetas. Solo popovers y diálogos llevan una sombra suave y un overlay
Foco
Anillo de 2 px primary-text con 2 px de separación, siempre visible con teclado
Iconos
Lucide, trazo 1.5, 16 px en controles y 20 px en navegación
Contenedor
Ancho máximo 1280 px, gutters de 24 px, cuadrícula de 12 columnas con gap de 16 o 24 px
Densidad
Cómoda por defecto (filas de tabla de 40 px) y compacta opcional (32 px)
App shell:
• Sidebar de 232 px, colapsable a 56 px (solo íconos). Debajo de 1024 px pasa a ser un Sheet deslizable.
• Topbar de 48 px: migas de pan, botón de paleta de comandos (⌘K), selector de tema (claro, oscuro, sistema) y la insignia del run (modo y hash corto).
• Cabecera de página: título (headline), una línea de contexto y los filtros. Nada más antes del contenido.
• Móvil: una sola columna, tablas con scroll horizontal y primera columna fija, objetivos táctiles de 44 px.
7. Movimiento y skeletons
Movimiento
• Duraciones: 120 ms (hover y foco), 200 ms (paneles, popovers, cambio de pestaña) y 320 ms (transición de página y dibujo de gráficos). Curva cubic-bezier(0.2, 0, 0, 1).
• Se anima lo que explica un cambio (un panel que entra, una barra que cambia de valor); la decoración no se anima.
• Los gráficos se dibujan una sola vez al montar; al filtrar solo interpolan valores.
• Se respeta prefers-reduced-motion: sin barridos ni transiciones largas.
Skeletons (obligatorios en toda carga de datos)
1.  Misma forma y tamaño que el contenido final: cero saltos de layout.
2.  Se muestran solo si la carga supera ~150 ms y, una vez visibles, duran al menos ~300 ms para evitar el parpadeo.
3.  El shell (sidebar, topbar, títulos y filtros) aparece al instante. Cada widget tiene su propio skeleton con loading.tsx por ruta y <Suspense> por tarjeta, para hacer streaming.
4.  Texto: 2 o 3 líneas de anchos distintos. KPI: etiqueta y número. Gráfico: marco de ejes con barras o línea tenues. Tabla: encabezado real y 8 filas.
5.  Barrido muy sutil de surface-2 a surface-4 en 1,6 s, sin colores de acento.
6.  Accesibilidad: contenedor con aria-busy y texto oculto «Cargando…»; los bloques del skeleton llevan aria-hidden.
7.  Si pasan más de ~4 s (arranque en frío de Vercel o Neon) se muestra bajo el skeleton «Despertando el servicio, puede tardar unos segundos» y se reintenta con backoff (2 reintentos).
.skeleton {
  background-color: var(--surface-2);
  background-image: linear-gradient(90deg, transparent, color-mix(in oklab, var(--surface-4) 70%, transparent), transparent);
  background-size: 200% 100%;
  animation: sweep 1.6s ease-in-out infinite;
}
@keyframes sweep { from { background-position: 200% 0 } to { background-position: -200% 0 } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none } }
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-md', className)} />;
}
8. Tokens en código (Tailwind v4 y shadcn/ui)
Tailwind v4 es CSS-first: los tokens viven en app/globals.css y generan clases como bg-canvas, text-ink y border-hairline. El bloque final conecta las variables de shadcn/ui con nuestra paleta para que sus componentes la hereden sin retocarlos. Si el CLI de shadcn genera un tailwind.config.* de la versión 3, bórrenlo.
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --canvas: #fcf8fa; --surface-1: #ffffff; --surface-2: #f8f1f5; --surface-3: #f1e7ed; --surface-4: #eadde5;
  --hairline: #eadce4; --hairline-strong: #d9c6d2; --hairline-tertiary: #c7b0bf;
  --ink: #1b1119; --ink-muted: #55434f; --ink-subtle: #7d6b77; --ink-tertiary: #a29098;
  --primary: #c8327e; --primary-hover: #b02b6f; --primary-pressed: #96245e;
  --primary-text: #b3276f; --primary-subtle: rgb(200 50 126 / 0.10); --on-primary: #ffffff;
  --s1: #c8327e; --s2: #6e56cf; --s3: #1f9a6b; --s4: #b87a0a; --s5: #1e8fa3; --s6: #cf3d55;
  --success-ink: #14724f; --warning-ink: #7a4f00; --danger-ink: #a82a40; --info-ink: #5b44b8;
}
.dark {
  --canvas: #0a0709; --surface-1: #120c11; --surface-2: #181118; --surface-3: #1f161f; --surface-4: #261b25;
  --hairline: #2a1f29; --hairline-strong: #3a2c39; --hairline-tertiary: #4a3948;
  --ink: #f7f2f5; --ink-muted: #d3c7cf; --ink-subtle: #9a8a96; --ink-tertiary: #6b5c68;
  --primary: #c8327e; --primary-hover: #db4a93; --primary-pressed: #ad2a6c;
  --primary-text: #f07db3; --primary-subtle: rgb(200 50 126 / 0.14); --on-primary: #ffffff;
  --s1: #e0549a; --s2: #9c86f5; --s3: #3dbe8b; --s4: #f2b84b; --s5: #3fb8c9; --s6: #f0707f;
  --success-ink: #3dbe8b; --warning-ink: #f2b84b; --danger-ink: #f0707f; --info-ink: #9c86f5;
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface-1: var(--surface-1); --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3); --color-surface-4: var(--surface-4);
  --color-hairline: var(--hairline); --color-hairline-strong: var(--hairline-strong);
  --color-hairline-tertiary: var(--hairline-tertiary);
  --color-ink: var(--ink); --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle); --color-ink-tertiary: var(--ink-tertiary);
  --color-primary: var(--primary); --color-primary-text: var(--primary-text);
  --color-series-1: var(--s1); --color-series-2: var(--s2); --color-series-3: var(--s3);
  --color-series-4: var(--s4); --color-series-5: var(--s5); --color-series-6: var(--s6);
  --font-sans: var(--font-geist-sans); --font-mono: var(--font-geist-mono);
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;
}

/* Puente para shadcn/ui y su componente de gráficos */
:root, .dark {
  --background: var(--canvas); --foreground: var(--ink);
  --card: var(--surface-1); --card-foreground: var(--ink);
  --popover: var(--surface-3); --popover-foreground: var(--ink);
  --primary-foreground: var(--on-primary);
  --muted: var(--surface-2); --muted-foreground: var(--ink-subtle);
  --accent: var(--surface-2); --accent-foreground: var(--ink);
  --border: var(--hairline); --input: var(--hairline-strong); --ring: var(--primary-text);
  --chart-1: var(--s1); --chart-2: var(--s2); --chart-3: var(--s5); --chart-4: var(--s4); --chart-5: var(--s3);
}
La clase dark va sobre <html> (lo hace next-themes con attribute='class', defaultTheme='system' y disableTransitionOnChange). El modo oscuro es el de referencia; revisen siempre el claro.
9. Stack del frontend
Pieza
Herramienta
Nivel
Para qué
Framework
Next.js 16 (App Router, Turbopack, React Compiler)
Obligatorio
Páginas, streaming y Route Handlers
Lenguaje
React 19 y TypeScript estricto
Obligatorio
Tipos de punta a punta
Estilos
Tailwind CSS v4
Obligatorio
Tokens como clases (sección 8)
Componentes
shadcn/ui (Radix)
Obligatorio
Primitivas accesibles que copiamos y modificamos
Gráficos
Recharts vía el componente chart de shadcn
Obligatorio
Gráficos temáticos con nuestros tokens
Íconos
lucide-react
Obligatorio
Trazo 1.5
Tema
next-themes
Obligatorio
Claro, oscuro y sistema
Cliente de API
openapi-typescript y openapi-fetch
Obligatorio
Cliente tipado desde el OpenAPI del backend
Datos en cliente
TanStack Query
Recomendado
Mutaciones, reintentos y sondeo de /status
Tablas
TanStack Table
Recomendado
Orden, columnas y filas expandibles
Estado en URL
nuqs
Recomendado
Filtros compartibles por enlace
Formularios
react-hook-form y zod
Recomendado
Validación con mensajes claros
Comandos
cmdk (Command de shadcn)
Recomendado
Paleta ⌘K
Avisos
sonner
Recomendado
Toasts discretos
Movimiento
motion
Opcional
Solo transiciones de paneles
Mocks
MSW
Recomendado
Desarrollar sin backend, con el esquema OpenAPI
Pruebas
Vitest, Testing Library, Playwright, @axe-core/playwright
Recomendado
Unitarias, e2e y accesibilidad
Paquetes
pnpm
Obligatorio
Instalación reproducible
Notas: (1) no agreguen otra librería de UI ni de gráficos (MUI, Chakra, Ant, Nivo, etc.). (2) Según el blog de Next.js, desde la 16.4 se recomiendan los Cache Components (use cache) y next dev mantiene un bloque AGENTS.md con la documentación de la versión instalada: conserven ese bloque y agreguen las reglas de la sección 19 en el mismo archivo. (3) Next.js 16 pide Node 20.9 o superior y deja middleware.ts como obsoleto; no lo necesitamos. Confirmen versiones con npm view next version al crear el proyecto.
10. Estructura del proyecto
frontend/
├─ app/
│  ├─ layout.tsx                 # fuentes (next/font), ThemeProvider, metadata
│  ├─ globals.css                # tokens (sección 8)
│  ├─ not-found.tsx
│  ├─ api/backend/[...path]/route.ts   # proxy hacia FastAPI (lista de rutas permitidas)
│  └─ (app)/                     # grupo con el shell
│     ├─ layout.tsx              # Sidebar + Topbar + CommandMenu
│     ├─ page.tsx                # Resumen
│     └─ campaigns/ models/ roi/ ab/ attribution/ channels/ budget/ whatif/ status/
│        └─ cada una: page.tsx, loading.tsx, error.tsx y _components/ propios
├─ components/
│  ├─ ui/                        # shadcn (se editan, no se envuelven)
│  ├─ app/                       # Sidebar, Topbar, CommandMenu, ThemeToggle, RunBadge
│  ├─ data/                      # KpiCard, DataTable, FilterBar, MetricInfo, SegmentChip, DeltaBadge
│  ├─ charts/                    # ChartFrame, TrendLine, CompareBars, RocCurve, CalibrationPlot, BubbleScatter, AllocationBar
│  ├─ states/                    # Skeleton, PageSkeleton, EmptyState, ErrorState, StaleBanner
│  ├─ notices/                   # SimulatedBadge, ObservationalNote, DemoModeBanner
│  └─ illustrations/             # IsoBox, FigOne, FigTwo, FigThree
├─ lib/
│  ├─ api/                       # schema.ts (generado), client.ts
│  ├─ format.ts                  # números, porcentajes, moneda, intervalos
│  ├─ palette.ts                 # mapa campaña → serie (916, 936, 1178)
│  └─ hooks/                     # useIdempotencyKey, useWarmupHint
├─ mocks/                        # handlers de MSW
└─ tests/                        # unit/ y e2e/
Regla: lo que solo usa una pantalla vive en su carpeta _components/; solo sube a components/ cuando lo usa una segunda pantalla.
11. Del backend a las pantallas

> **Implementación actual:** ver **sección 0** (endpoints reales, gaps del bloque `run` y de intervalos).

Contrato con el backend (ver también sección 0; API ya implementada):
• El cliente se genera con pnpm gen:api desde /openapi.json. Los tipos de la API nunca se escriben a mano.
• Toda respuesta incluye un bloque run (run_id, dataset_hash, mode: snapshot, memory o db, generated_at) que alimenta la RunBadge de la topbar.
• Errores: 422 (validación, se mapea a errores de campo), 409 (misma Idempotency-Key con cuerpo distinto) y 5xx (ErrorState con reintento).
• Banderas de honestidad: simulated: true (atribución Nivel B) activa SimulatedBadge; observational: true (A/B entre campañas) activa ObservationalNote.
• Las métricas llegan con ci_low y ci_high: siempre se dibuja el intervalo.
• Los null (por ejemplo, divisiones por cero) se muestran como «—» con tooltip que explica el motivo.
• GET /v1/status entrega modo de persistencia, outbox_pending y último sync.
Página
Ruta
Endpoints
Protagonista
Resumen
/
GET /v1/kpis, GET /v1/status (+ /v1/models para manifiesto)
Tarjetas KPI y eficiencia por campaña
Campañas y segmentos
/campaigns
GET /v1/segments
Tabla filtrable
Modelos
/models
GET /v1/models
Curvas ROC y PR, calibración, importancias
ROI
/roi
GET /v1/roi (sensibilidad); GET /v1/kpis (globales)
Sensibilidad y punto de equilibrio
A/B
/ab
POST /v1/ab-test
Veredicto con intervalo y posterior bayesiana
Atribución
/attribution
GET /attribution?model=
Shapley y comparación de modelos
Canales
/channels
GET /channels/compare
Burbujas de eficiencia
Recomendador
/budget
POST /v1/recommendations
Reparto actual vs recomendado
What-if
/whatif
POST /v1/predict
Probabilidad calibrada de convertir
Estado
/status
GET /status, POST /v1/admin/sync
Modo, outbox y hashes
12. Pantallas en detalle
1.  Resumen (/). Título y RunBadge. Fila de 4 tarjetas KPI (gasto, conversiones aprobadas, CPA y ROI) con comparación contra el promedio global y mini barras por campaña. Debajo, dos paneles: «Eficiencia por campaña» (barras de CPA con intervalo) y «Segmentos que más rinden» (top 5, enlazan a /campaigns con el filtro aplicado). Al final, el panel de tres columnas con FIG 0.1 a 0.3 como introducción descartable (se recuerda en localStorage). El protagonista es el ROI.
2.  Campañas y segmentos. Barra de filtros (campaña, edad, género e interés, multiselección) sincronizada con la URL. Tabla con segmento, impresiones, clics, gasto, CTR, CVR, CPA y ROAS: ordenable, con columnas ocultables y primera columna fija. Clic en una fila abre un panel lateral con el detalle frente al promedio. Exportar CSV desde el cliente y alternar densidad.
3.  Modelos. Selector de modo (pre-lanzamiento o en vuelo) y de modelo (RF, AdaBoost y baselines). Fila de métricas (ROC-AUC, PR-AUC, F1 y Brier) con intervalos. Gráficos: curvas ROC y PR superpuestas, calibración, matriz de confusión al umbral elegido y barras horizontales de importancia por permutación. Tarjeta «RF vs AdaBoost» con la prueba de Wilcoxon explicada en una frase. Nota fija: Total_Conversion no se usa como variable porque filtraría información.
4.  ROI. Campo numérico y deslizador para el valor por conversión aprobada (con useDeferredValue para no recalcular en cada tecla). Tabla de KPIs por campaña con el ROI en verde o coral según el signo. Gráfico de sensibilidad (ROI contra valor, una línea por campaña) con el punto de equilibrio marcado y una frase que lo traduce: «Con menos de X por conversión, la campaña 936 pierde dinero».
5.  A/B. Dos pestañas. Entre campañas (con ObservationalNote fija): elegir A, B y la métrica (CTR, CVR o CPA); resultado con diferencia, intervalo, p ajustado por Holm, tamaño del efecto, P(A>B) bayesiana y densidades posteriores superpuestas, más un veredicto en una frase. Simulador: visitas y conversiones de dos variantes y calculadora de tamaño de muestra.
6.  Atribución. Panel «Nivel A (datos reales)»: barras divergentes de contribución de Shapley por factor (campaña, edad, género e interés). Panel «Nivel B (simulado)» con borde punteado ámbar y SimulatedBadge permanente: selector de modelo (first touch, last touch, linear, time decay, position based y Markov) y comparación en barras agrupadas. Una línea de ayuda por modelo.
7.  Canales. Gráfico de burbujas (CPA en X, ROAS en Y, tamaño por gasto) para campañas y segmentos, con ranking lateral. Aviso: «Hoy solo hay datos de Facebook; la comparación es entre campañas y segmentos». El selector de canal existe con una sola opción, listo para más.
8.  Recomendador. A la izquierda un formulario (presupuesto total, paso y restricciones por segmento en un acordeón: mínimo, máximo y excluir). A la derecha, una barra apilada «Reparto actual vs recomendado», la tabla con deltas por segmento y el ROI esperado con intervalo. «Calcular» es la acción primaria y «Guardar recomendación» envía con Idempotency-Key. Debajo, el historial con un chip de sincronización («Guardada» o «3 pendientes»). Aviso: se basa en el histórico y no garantiza resultados.
9.  What-if. Formulario compacto (campaña, edad, género e interés; en modo en vuelo, impresiones, clics y gasto). Resultado: barra horizontal con la probabilidad calibrada y su intervalo, comparación con el promedio del segmento y los 3 factores que más la empujan (Shapley local). Sin velocímetros ni gauges.
10.  Estado (/status). Modo de persistencia, elementos pendientes en el outbox, último sync, hashes del run, versión de scikit-learn del manifiesto y salud de la base de datos. Botón «Sincronizar ahora» con confirmación. Diagrama de los niveles L1, L2 y L3 con estilo FIG. Está pensada para que el profesor entienda qué pasa por debajo.
13. Componentes, gráficos y tablas
Componente
Qué hace
Reglas
KpiCard
Etiqueta, valor (kpi), delta y nota
Valor en tabular, delta con signo y color semántico, MetricInfo con la definición del KPI
ChartFrame
Marco de un gráfico: título, subtítulo, leyenda, acciones
Título que enuncia la conclusión; botón «Ver como tabla»; altura mínima para evitar saltos
DataTable
Tabla con orden, columnas y filas expandibles
Encabezado fijo, números alineados a la derecha en mono, estado vacío propio
FilterBar
Filtros sincronizados con la URL
Chips removibles y botón «Limpiar»
RunBadge
Modo y hash corto del run
Tooltip con dataset_hash y generated_at
SimulatedBadge
Marca de datos simulados
Ámbar, borde punteado y texto «Datos simulados»
ObservationalNote
Aviso de comparación no aleatorizada
Nota discreta bajo el título
StateBoundary
Suspense, error y vacío en uno
Cada widget decide su estado sin tumbar la página
CommandMenu
Paleta ⌘K
Navegar entre páginas, cambiar tema y densidad, copiar el hash del run
Reglas de gráficos:
1.  El título enuncia la conclusión («La campaña 1178 tiene el menor CPA»), no solo el nombre de la métrica.
2.  Etiquetas directas en lugar de leyenda cuando hay 3 series o menos.
3.  Cuadrícula solo horizontal, con hairline al 40% de opacidad. Ejes en caption y color ink-subtle.
4.  Barras siempre desde cero. Sin 3D, sin pasteles ni donas (el reparto se muestra como barra apilada).
5.  Intervalos de confianza como bigotes o bandas translúcidas, nunca omitidos.
6.  Tooltip sobre surface-3 con borde hairline-strong y números tabulares.
7.  Color más forma o trazo: ninguna información depende solo del color.
8.  Alternativa accesible: cada gráfico se puede ver como tabla.
9.  Se cargan con next/dynamic y su skeleton para no inflar el bundle inicial.
Formato de números (lib/format.ts): Intl.NumberFormat con es-CO; moneda configurable (USD por defecto); compacto desde 10.000; porcentajes con 1 o 2 decimales; intervalos como 12,4 % [10,1 – 14,8]; null como «—». Ningún componente formatea por su cuenta.
14. Estados y microcopy
Estado
Tratamiento
Ejemplo de texto
Cargando
Skeleton con la forma final
(sin texto)
Vacío
EmptyState con una figura isométrica pequeña
«Ningún segmento cumple estos filtros. Quita la edad o el interés para ampliar.»
Error
ErrorState dentro del widget, con «Reintentar»
«No pudimos calcular el reparto. Revisa el presupuesto o reintenta.»
Parcial
Cada widget falla por separado
El resto de la página sigue funcionando
Desactualizado
StaleBanner
«Mostrando el último resultado guardado (run a1b2c3).»
Modo demo (mode=off)
DemoModeBanner
«Modo demo: los cambios no se guardan al cerrar.»
Pendiente de sync
Chip ámbar
«3 cambios sin sincronizar»
Datos simulados
Borde punteado ámbar y badge
«Datos simulados: no corresponden a usuarios reales.»
Observacional
Nota bajo el título
«Comparación observacional: las campañas no se asignaron al azar.»
Éxito
Toast de 4 s
«Recomendación guardada.»
Voz: técnica, directa y en tuteo; sin exclamaciones ni emojis; verbos concretos y números con unidades.
15. Ilustraciones isométricas de línea (FIG 0.x)
• Solo trazo de 1 px (vector-effect: non-scaling-stroke), sin relleno o con surface-1, proyección isométrica a 30°.
• Aristas principales en ink-subtle, caras laterales en hairline-strong y un único elemento en primary-text.
• Decorativas (aria-hidden) con una leyenda real debajo. Etiqueta «FIG 0.x» en label-mono arriba a la izquierda.
• Tres figuras: FIG 0.1 Capas (6 losas apiladas, la de arriba en magenta), FIG 0.2 Módulos (6 cubos agrupados, uno en magenta) y FIG 0.3 Escamas (9 láminas verticales escalonadas con altura decreciente).
• Se usan en: la introducción de Resumen (tres columnas con línea vertical), los estados vacíos (versión pequeña), el 404, /status y el README. En ningún otro lado.
const C = Math.cos(Math.PI / 6);
const iso = (x: number, y: number, z: number): [number, number] => [(x - y) * C, (x + y) * 0.5 - z];
const poly = (p: [number, number][]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

export function IsoBox({ x = 0, y = 0, z = 0, w, d, h, accent = false }: {
  x?: number; y?: number; z?: number; w: number; d: number; h: number; accent?: boolean;
}) {
  const top = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
  const left = [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)];
  const right = [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)];
  return (
    <g fill='none' strokeLinejoin='round'>
      <polygon points={poly(left)} className='stroke-hairline-strong' vectorEffect='non-scaling-stroke' />
      <polygon points={poly(right)} className='stroke-hairline-strong' vectorEffect='non-scaling-stroke' />
      <polygon points={poly(top)} className={accent ? 'stroke-primary-text' : 'stroke-ink-subtle'} vectorEffect='non-scaling-stroke' />
    </g>
  );
}
FIG 0.1 se compone con un bucle de IsoBox (w = d = 120, h = 8, z = i * 14); FIG 0.2 con cubos en una cuadrícula de 2 por 3; FIG 0.3 con cajas delgadas (w = 6, d = 70) desplazadas en x con altura decreciente. Se recomienda calcular el viewBox a partir de los puntos extremos.
16. Integración con el backend (código)
Proxy. El navegador solo habla con su propio origen; el Route Handler reenvía a FastAPI con una lista de rutas y métodos permitidos:
// app/api/backend/[...path]/route.ts
const BASE = process.env.BACKEND_URL!;
const ALLOWED: Record<string, string[]> = {
  'v1/health': ['GET'],
  'v1/status': ['GET'],
  'v1/kpis': ['GET'],
  'v1/roi': ['GET'],
  'v1/models': ['GET'],
  'v1/segments': ['GET'],
  'v1/channels/compare': ['GET'],
  'v1/attribution': ['GET'],
  'v1/recommendations': ['GET', 'POST'],
  'v1/predict': ['POST'],
  'v1/ab-test': ['POST'],
  'v1/admin/sync': ['POST'],
};

async function forward(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.join('/');
  if (!ALLOWED[path]?.includes(req.method)) return new Response('Not found', { status: 404 });
  const key = req.headers.get('idempotency-key');
  const upstream = await fetch(`${BASE}/${path}${new URL(req.url).search}`, {
    method: req.method,
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json', ...(key && { 'idempotency-key': key }) },
    body: req.method === 'GET' ? undefined : await req.text(),
    cache: 'no-store',
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
export { forward as GET, forward as POST };
Cliente tipado. En el servidor se llama directo a BACKEND_URL y en el navegador al proxy:
// lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './schema';

export const api = createClient<paths>({
  baseUrl: typeof window === 'undefined' ? process.env.BACKEND_URL : '/api/backend',
});
Idempotency-Key. Una clave por intento de envío, reutilizada en los reintentos y nueva solo cuando cambia el contenido:
export function useIdempotencyKey(payload: unknown) {
  const ref = useRef<{ sig: string; key: string } | null>(null);
  const sig = JSON.stringify(payload);
  if (!ref.current || ref.current.sig !== sig) ref.current = { sig, key: crypto.randomUUID() };
  return ref.current.key;
}
Patrón de datos. Server Components para la carga inicial (con Cache Components y cacheLife para los endpoints de solo lectura, con run_id como parte de la clave, si el equipo adopta ese modelo; verifiquen la API vigente en la documentación versionada del proyecto). TanStack Query solo para mutaciones, reintentos y el sondeo de /status. Nada de fetch dentro de useEffect.
17. Accesibilidad y rendimiento
• Contraste AA en ambos modos y foco visible siempre. Todo es operable con teclado, incluida la paleta ⌘K.
• Resultados asíncronos anunciados con aria-live='polite'. Gráficos con alternativa en tabla y descripción textual.
• Objetivos táctiles de 44 px en móvil, prefers-reduced-motion respetado y sin información solo por color.
• Server Components por defecto; 'use client' solo en controles interactivos. Gráficos con next/dynamic.
• next/font para Geist, next/image para cualquier imagen y reserva de espacio en todo lo asíncrono (CLS cercano a 0).
• Meta de Lighthouse de 90 o más en / (rendimiento y accesibilidad), medida en el despliegue de preview.
• Presupuesto orientativo de JS inicial por ruta inferior a 200 KB comprimidos; revisen con el analizador de bundle antes de agregar dependencias.
18. Plan de trabajo y Definition of Done

Único bloque de producto **pendiente** en el repo (el backend y la API `/v1` ya están listos). Días relativos al inicio del frontend.
Fase
Días
Entregable
F0
1 a 2
Proyecto, tokens, fuentes, tema claro y oscuro, shell, Skeleton, ErrorState, cliente generado y proxy
F1
3 a 5
KpiCard, DataTable, FilterBar, ChartFrame, estados, MSW, páginas Resumen y Estado
F2
6 a 8
Campañas, Modelos y ROI
F3
9 a 11
A/B, Atribución y Canales
F4
12 a 14
Recomendador, What-if y paleta de comandos
F5
15 a 16
Ilustraciones FIG, pulido en claro y oscuro, accesibilidad, rendimiento y capturas para el README
Definition of Done de la interfaz:
[ ] Las 10 páginas funcionan con datos reales del backend y con mocks (MSW).
[ ] Toda carga tiene skeleton con la forma final y todo widget tiene estado vacío y de error.
[ ] Sin colores, radios ni sombras fuera de los tokens (se revisa con búsqueda en el código).
[ ] Modo claro y oscuro revisados pantalla por pantalla.
[ ] Intervalos visibles, SimulatedBadge y ObservationalNote donde corresponde.
[ ] pnpm lint, pnpm typecheck, pnpm test y pnpm build en verde; cliente generado sin diferencias.
[ ] Pruebas de accesibilidad con axe sin errores graves y navegación por teclado verificada.
[ ] Capturas en claro y oscuro en el README y demo de 5 minutos ensayada.
19. AGENTS.md del frontend y prompt
# Reglas del frontend de PITAYA
- Next.js (App Router) + TypeScript estricto. eslint, tsc --noEmit y pnpm build en verde.
- Colores, radios y tipografía SOLO desde los tokens (bg-canvas, text-ink, border-hairline...). Prohibido hex y clases de color de Tailwind (bg-blue-500, etc.).
- Sin sombras en tarjetas, sin degradados y sin blur salvo en overlays.
- Un solo acento: primary. Colores de campaña fijos (916 series-1, 936 series-2, 1178 series-5).
- Tipos de la API solo desde lib/api (pnpm gen:api). No escribir tipos a mano.
- Server Components para datos; 'use client' solo donde hay interacción.
- Toda carga tiene skeleton con la forma final; todo widget tiene estado vacío y de error.
- Todo número pasa por lib/format.ts; null se muestra como «—».
- Toda métrica con intervalo muestra el intervalo. Datos simulados con SimulatedBadge; A/B entre campañas con ObservationalNote.
- Gráficos con el componente chart de shadcn (Recharts): máximo 4 series, etiqueta directa y vista como tabla.
- Sin librerías de UI o gráficos nuevas sin preguntar. Sin emojis ni texto con degradado.
- Textos al usuario en español (tuteo), técnicos y concretos; código en inglés.
- Cada componente se revisa en claro y oscuro, con teclado y con prefers-reduced-motion.
- Errores: toda llamada pasa por lib/api (ApiError y toUserMessage). Mensaje = qué pasó + qué hacer. Nunca limpiar un formulario al fallar. Cada widget aísla su propio error.
- Animación: primero CSS y motion; Lottie o Rive solo con next/dynamic y ssr: false. Prohibido el GIF dentro de la app (usar video o SVG). Respetar prefers-reduced-motion.
- Marca: usar PitayaMark con su mood; no recolorear ni deformar el logo. La mascota solo aparece en estados (vacío, error, éxito, arranque en frío).
Contexto: PITAYA UI (Next.js App Router, Tailwind v4, shadcn/ui). Adjunto AGENTS.md, globals.css (tokens) y los tipos generados de lib/api.
Tarea: construir la página /roi: control del valor por conversión, tabla de KPIs por campaña y gráfico de sensibilidad con el punto de equilibrio.
Datos: GET /v1/roi (sensibilidad; el backend fija el valor base por entorno hasta existir query en API) — Server Component para carga inicial; Client Component para el control, con useDeferredValue cuando el endpoint lo permita.
Incluye: loading.tsx con skeleton de la forma final, estado vacío, estado de error con reintento y vista del gráfico como tabla.
Diseño: solo tokens, sin sombras ni degradados, colores de campaña fijos, números tabulares y formato de lib/format.ts.
Pruebas: render con datos de ejemplo (MSW), estado de error y navegación por teclado.
Mantra del frontend: pocos colores, líneas finas, datos honestos y ningún salto de layout.
20. Logo y mascota: la pitaya
La marca es una pitaya con carita: simpática pero sobria, con formas planas, sin degradados ni brillos. Cuerpo magenta (primary), escamas verdes (series-3, que cambia con el tema) y cara en #1B1119. Es a la vez logo, favicon y mascota de los estados de la interfaz.
Reglas de uso
• Lockup: la marca más la palabra pitaya en Geist 600, minúsculas y tracking -0.04 em. En el sidebar, marca de 24 px.
• Espacio libre: como mínimo un cuarto de la altura de la marca alrededor.
• Tamaños: desde 24 px la versión completa; por debajo (favicon de 16 a 32 px) la versión simplificada, sin mejillas ni brillo.
• Prohibido recolorear, rotar, deformar o ponerle sombra o contorno. No se usa sobre fotos.
• Mascota: cambia de mood según el estado y siempre acompaña a un texto claro; en ese caso es decorativa (decorative).
mood
Dónde aparece
Tamaño
happy
Logo, bienvenida y éxito leve
24 a 96 px
celebrate
Al guardar la primera recomendación de la sesión (una sola vez)
96 px
thinking
Estados vacíos y «sin resultados»
96 px
oops
Errores de página o de widget grande, y el 404
96 a 120 px
sleepy
Arranque en frío («Despertando el servicio»)
96 px
// components/illustrations/PitayaMark.tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Mood = 'happy' | 'thinking' | 'oops' | 'sleepy' | 'celebrate';

const INK = '#1b1119';
const BODY = 'M64 22 C88 22 102 44 102 68 C102 94 86 112 64 112 C42 112 26 94 26 68 C26 44 40 22 64 22 Z';
const SHADE = 'M84 30 C96 38 102 52 102 68 C102 94 86 112 64 112 C80 106 92 90 92 68 C92 54 90 40 84 30 Z';
const CROWN = 'M64 26 C58 18 58 9 64 2 C70 9 70 18 64 26 Z';
// Lado izquierdo; el derecho es su espejo
const SIDE = [
  'M55 28 C47 22 43 14 44 6 C52 10 58 17 60 27 Z',
  'M32 58 C22 56 14 48 10 36 C22 35 32 40 36 48 Z',
  'M28 76 C18 74 11 68 7 60 C18 58 27 62 31 68 Z',
  'M34 98 C24 98 16 93 11 84 C22 82 32 86 38 92 Z',
  'M50 108 C44 112 40 118 42 124 C48 122 54 116 56 110 Z',
];

const MOUTH: Record<Mood, ReactNode> = {
  happy: <path d='M55 77 Q64 88 73 77' fill='none' stroke={INK} strokeWidth='3.2' strokeLinecap='round' />,
  thinking: <path d='M57 81 H71' fill='none' stroke={INK} strokeWidth='3.2' strokeLinecap='round' />,
  oops: <ellipse cx='64' cy='81' rx='3.6' ry='4.4' fill={INK} />,
  sleepy: <path d='M60 80 Q64 83 68 80' fill='none' stroke={INK} strokeWidth='3' strokeLinecap='round' />,
  celebrate: (
    <>
      <path d='M53 75 Q64 94 75 75 Z' fill={INK} />
      <path d='M58 84 Q64 90 70 84 Q64 80 58 84 Z' fill='#f07db3' />
    </>
  ),
};

function Face({ mood }: { mood: Mood }) {
  const closed = mood === 'sleepy' || mood === 'celebrate';
  const [base, peak] = mood === 'celebrate' ? [69, 62] : [66, 71]; // ^ ^ al celebrar, ∪ ∪ al dormir
  return (
    <g>
      {closed ? (
        <g fill='none' stroke={INK} strokeWidth='3' strokeLinecap='round'>
          <path d={`M48 ${base} Q53 ${peak} 58 ${base}`} />
          <path d={`M70 ${base} Q75 ${peak} 80 ${base}`} />
        </g>
      ) : (
        <g className='pitaya-eyes'>
          <circle cx='53' cy='66' r='4.4' fill={INK} />
          <circle cx='75' cy='66' r='4.4' fill={INK} />
          <circle cx='54.5' cy='64.5' r='1.5' fill='#fff' />
          <circle cx='76.5' cy='64.5' r='1.5' fill='#fff' />
        </g>
      )}
      <ellipse cx='45' cy='77' rx='5.5' ry='3.4' fill='#f9a8cc' opacity='.55' />
      <ellipse cx='83' cy='77' rx='5.5' ry='3.4' fill='#f9a8cc' opacity='.55' />
      {MOUTH[mood]}
      {mood === 'thinking' && <path d='M69 57 L80 55' stroke={INK} strokeWidth='3' strokeLinecap='round' />}
      {mood === 'oops' && <path d='M91 44 C94 49 94 53 91 53 C88 53 88 49 91 44 Z' className='fill-series-5' />}
      {mood === 'sleepy' && (
        <path d='M88 36 h9 l-9 10 h9' fill='none' className='stroke-ink-subtle' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
      )}
      {mood === 'celebrate' && (
        <g className='fill-series-4'>
          <path d='M20 24 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z' />
          <path d='M108 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z' />
        </g>
      )}
    </g>
  );
}

export function PitayaMark({ mood = 'happy', size = 64, decorative = false, className }: {
  mood?: Mood; size?: number; decorative?: boolean; className?: string;
}) {
  return (
    <svg viewBox='0 0 128 128' width={size} height={size} className={cn('pitaya', className)}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Pitaya, la mascota de PITAYA' })}>
      <g className='fill-series-3'>
        <path d={CROWN} />
        {SIDE.map((d) => <path key={d} d={d} />)}
        <g transform='matrix(-1 0 0 1 128 0)'>{SIDE.map((d) => <path key={d} d={d} />)}</g>
      </g>
      <path d={BODY} className='fill-primary' />
      <path d={SHADE} fill='#a82a6c' opacity='.55' />
      <path d='M44 46 C47 38 53 33 60 31' fill='none' stroke='#fff' strokeOpacity='.4' strokeWidth='4' strokeLinecap='round' />
      <Face mood={mood} />
    </svg>
  );
}
Vida mínima, solo CSS (se desactiva con prefers-reduced-motion): la pitaya parpadea cada pocos segundos y da un saltito al celebrar.
.pitaya-eyes { transform-box: fill-box; transform-origin: center; animation: blink 5.5s infinite; }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1) } 97% { transform: scaleY(0.1) } }
.pitaya-hop { animation: hop 520ms cubic-bezier(0.2, 0, 0, 1) 1; }
@keyframes hop { 40% { transform: translateY(-8%) } 100% { transform: none } }
@media (prefers-reduced-motion: reduce) { .pitaya-eyes, .pitaya-hop { animation: none } }
Favicon (app/icon.svg). Versión simplificada con colores fijos, porque un favicon no lee las variables CSS. Next.js lo detecta por convención. La imagen social se genera con app/opengraph-image.tsx (ImageResponse de next/og) usando la misma pitaya.
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
  <g fill='#2fa77a'>
    <path d='M64 26 C58 18 58 9 64 2 C70 9 70 18 64 26 Z'/>
    <path d='M55 28 C47 22 43 14 44 6 C52 10 58 17 60 27 Z'/>
    <path d='M73 28 C81 22 85 14 84 6 C76 10 70 17 68 27 Z'/>
    <path d='M32 58 C22 56 14 48 10 36 C22 35 32 40 36 48 Z'/>
    <path d='M96 58 C106 56 114 48 118 36 C106 35 96 40 92 48 Z'/>
    <path d='M28 76 C18 74 11 68 7 60 C18 58 27 62 31 68 Z'/>
    <path d='M100 76 C110 74 117 68 121 60 C110 58 101 62 97 68 Z'/>
  </g>
  <path fill='#c8327e' d='M64 22 C88 22 102 44 102 68 C102 94 86 112 64 112 C42 112 26 94 26 68 C26 44 40 22 64 22 Z'/>
  <circle cx='53' cy='66' r='5' fill='#1b1119'/>
  <circle cx='75' cy='66' r='5' fill='#1b1119'/>
  <path d='M55 77 Q64 88 73 77' fill='none' stroke='#1b1119' stroke-width='4' stroke-linecap='round'/>
</svg>
21. Vida en la interfaz: animación, SVG y GIF
Criterio: la vida viene de pocos momentos bien elegidos, no de mover todo. Máximo un elemento animado en bucle por pantalla (aparte del skeleton y el parpadeo de la pitaya). Los momentos con vida son:
1.  El logo parpadea y la mascota cambia según el estado (vacío, error, arranque en frío, éxito).
2.  Al guardar una recomendación: check que se dibuja y, solo la primera vez de la sesión, una ráfaga corta de confeti.
3.  Gráficos: la línea se dibuja una vez al montar y las barras crecen en 320 ms.
4.  La introducción FIG 0.1 a 0.3 dibuja sus trazos al aparecer por primera vez.
5.  Microfeedback: pressed de botones, interruptores, tooltips con retardo y el estado «Copiado» en el propio botón.
Necesidad
Herramienta
Nivel
Cómo se usa
SVG como componentes
@svgr/webpack con turbopack.rules (o @svgr/cli para generar componentes una vez)
Recomendado
La documentación de Next.js muestra la regla '*.svg' con loaders: ['@svgr/webpack'] y as: '*.js'
Optimizar SVG
svgo (SVGR lo integra)
Recomendado
pnpm dlx svgo -r assets/svg antes de commitear
Animación de SVG, paneles y trazos
motion (motion/react)
Recomendado
pathLength para dibujar trazos, AnimatePresence para paneles
Animaciones vectoriales listas (loaders, check)
@lottiefiles/dotlottie-react (formato .lottie)
Opcional
Cargar con next/dynamic y ssr: false; pesa alrededor de 35 KB comprimido; usar archivos propios o con licencia libre
Mascota interactiva con estados
@rive-app/react-canvas
Opcional (versión 2)
Máquinas de estado en un .riv; más pesada (WASM), solo si CSS y motion no alcanzan
Celebración puntual
canvas-confetti
Opcional
Una ráfaga corta con series-1, series-3 y series-4; omitir con prefers-reduced-motion
Utilidades de animación en Tailwind
tw-animate-css
Incluido
Lo instala shadcn en proyectos nuevos con Tailwind v4 (confírmenlo); animate-in, fade-in
Transición entre páginas
View Transitions de Next.js
Opcional
Solo un cross-fade corto; confirmen la opción en la documentación de su versión
Imagen social
next/og
Recomendado
app/opengraph-image.tsx con la pitaya
GIF o video para README y demo
Playwright (video), ffmpeg y gifski
Recomendado
Grabar el flujo con Playwright y convertirlo; el GIF solo vive en el README
Qué no usar: GIF dentro de la app (pesan, no se pausan y no respetan prefers-reduced-motion); en su lugar SVG animado, Lottie o <video autoPlay muted loop playsInline> en MP4 o WebM. Tampoco three.js, tsparticles, GSAP ni contadores que «suben»: no aportan a esta interfaz.
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: { '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' } },
  },
};
export default nextConfig;
Con esa regla todo import X from './x.svg' devuelve un componente; agreguen un svgr.d.ts que declare *.svg para TypeScript.
// Check que se dibuja al guardar (motion)
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function DrawnCheck({ size = 20 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' aria-hidden className='stroke-series-3'>
      <motion.path d='M5 12.5l4.5 4.5L19 7.5' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'
        initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }} />
    </svg>
  );
}
Dibujo de trazos de las figuras FIG sin dependencias: se pone pathLength='1' en cada forma y se anima el desplazamiento del trazo.
.fig-draw * { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 900ms cubic-bezier(0.2, 0, 0, 1) forwards; }
@keyframes draw { to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .fig-draw * { animation: none; stroke-dashoffset: 0 } }