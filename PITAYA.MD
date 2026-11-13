PITAYA: Predictive Investment, Testing & Attribution for Yield Analytics
Guía y prompt maestro del proyecto final de Minería de Datos.

Stack: Next.js (App Router + TypeScript) + FastAPI (Python).
Arquitectura: monolito modular, memoria primero, persistencia opcional.
Despliegue objetivo: Vercel, sin servicios externos obligatorios.

Tagline: cosecha más retorno de cada peso de pauta.

1. Qué es PITAYA
PITAYA es un sistema analítico de punta a punta sobre datos de Facebook Ads que responde cuatro preguntas de negocio:
1. Qué anuncios, campañas y audiencias convierten más (modelos predictivos).
2. Cuánto retorno deja cada campaña (ROI).
3. Qué diferencias observadas son estadísticamente relevantes (A/B testing).
4. Cómo repartir el próximo presupuesto (recomendación de inversión).
Se entrega como una aplicación web desplegada en Vercel para que el profesor pueda probarla desde una URL pública.
Decisiones principales
- Frontend: Next.js con App Router, TypeScript, shadcn/ui y Recharts.
- Backend: FastAPI, API JSON y documentación OpenAPI.
- Contrato front-back: cliente TypeScript generado desde OpenAPI. El navegador consume la API mediante Route Handlers de Next.js como proxy cuando convenga mantener un único origen.
- Arquitectura: monolito modular organizado por dominios y workflows. No se implementan microservicios.
- Persistencia: memoria primero. SQLite para desarrollo local y PostgreSQL como opción de persistencia durable cuando se configure. Ninguna base de datos es requisito para ejecutar la demo.
- Despliegue: Next.js y FastAPI en Vercel, dentro de las capacidades y límites vigentes de la plataforma. Si el despliegue conjunto no está disponible para el plan o la configuración elegida, se podrá desplegar el frontend y backend como dos proyectos de Vercel, sin introducir una base de datos externa obligatoria.
- Datos y modelos: dataset de demostración y artefactos entrenados incluidos en el repositorio/despliegue. La aplicación no entrena modelos durante las peticiones web.
Modos de ejecución
Modo	Configuración	Comportamiento	Persistencia
memory	Sin DATABASE_URL	La aplicación funciona con snapshot, caché y estado temporal en RAM	Temporal; puede perderse al reiniciar la instancia
sqlite	DATABASE_URL=sqlite:///./data/pitaya.db	Desarrollo local con almacenamiento en archivo	Durable mientras se conserve el archivo
postgres	DATABASE_URL PostgreSQL	Persistencia compartida y durable	Durable según el proveedor configurado


La aplicación debe iniciar en modo memory si no existe una URL de base de datos o si la conexión no está disponible. El estado de la persistencia debe ser visible en /status y en la interfaz.

Límite importante de Vercel: la memoria de una función serverless no es almacenamiento durable ni compartido entre instancias. La caché puede acelerar lecturas, pero no debe ser la única copia de información que el usuario espere conservar. Sin base de datos, PITAYA funciona como demo analítica sin persistencia garantizada de las escrituras. La sincronización diferida solo puede considerarse una optimización de mejor esfuerzo mientras la instancia siga viva; no debe prometerse como una cola durable.
2. Requerimientos del curso → módulos
Requerimiento	Módulo	Resolución
Predicción de conversión (Random Forest y AdaBoost)	modeling	Ambos modelos, baselines, validación cruzada repetida, calibración y comparación estadística
Análisis de ROI	performance	KPIs con valor por conversión configurable y análisis de sensibilidad
A/B testing	experiments	Análisis frecuentista y bayesiano, corrección de Holm y simulador
Modelos de atribución	attribution	Nivel A: Shapley por factores con datos reales. Nivel B: trayectorias simuladas, identificadas como simuladas
Dashboard de campañas	frontend/	Páginas Next.js con shadcn/ui y Recharts; guía en `frontend/FRONTEND.md`
Recomendación de inversión	budget	Asignación marginal con retornos decrecientes y encogimiento bayesiano
Comparación de canales	performance	Canal como dimensión extensible; el dataset actual permite comparar campañas y segmentos
Aplicación web	frontend/ + backend/	Next.js como interfaz y FastAPI como API JSON


3. Dataset y límites
Dataset Facebook Ad Campaign de Kaggle (madislemsalu/facebook-ad-campaign). Según su descripción habitual, contiene aproximadamente 1.143 filas y columnas como ad_id, xyz_campaign_id (916, 936, 1178), fb_campaign_id, age, gender, interest, Impressions, Clicks, Spent, Total_Conversion y Approved_Conversion.

El esquema se valida en `make ingest` (normalización Kaggle + `quality_report.json`). Tras limpieza quedan ~761 filas útiles (se descartan filas con campaña mal alineada en el CSV fuente).
Lo que el dataset no contiene
- No tiene fechas ni trayectorias de usuario: no permite reconstruir atribución multitoque real. El Nivel A atribuye resultados a factores disponibles (campaña, edad, género e interés) mediante Shapley. El Nivel B usa trayectorias sintéticas y debe llevar una etiqueta visible de “Datos simulados”.
- Solo contiene Facebook: se comparan campañas y segmentos. channel queda como dimensión preparada para futuras fuentes.
- No contiene ingresos reales: el ROI utiliza value_per_approved_conversion, configurable por el usuario, y muestra sensibilidad frente a ese supuesto.
- No es un experimento aleatorizado: la comparación entre campañas es observacional. La interfaz y los textos del informe deben decirlo explícitamente.
- Total_Conversion no puede usarse como feature para predecir Approved_Conversion: puede introducir fuga de información.
Target principal: converted = Approved_Conversion > 0.

Dos escenarios de predicción:
- Pre-lanzamiento: campaña, edad, género e interés.
- En vuelo: impresiones, clics, gasto, CTR, CPC y CPM, siempre usando variables disponibles en el momento de la predicción y evitando fuga de información.
4. Decisiones técnicas
Área	Decisión	Motivo
Frontend	Next.js App Router + TypeScript	Stack principal del equipo y experiencia de usuario completa
UI	shadcn/ui + Tailwind CSS + Recharts	Componentes consistentes y visualizaciones
Backend	FastAPI, solo JSON	Contrato explícito, validación Pydantic y OpenAPI
Cliente API	TypeScript generado desde OpenAPI	Evitar tipos duplicados manualmente
Comunicación	Route Handler proxy de Next.js cuando sea útil	Un solo origen para el navegador y menor exposición de la URL interna del backend
Arquitectura	Monolito modular	Separación por dominio sin complejidad de microservicios
Persistencia	Adaptador opcional: memoria, SQLite o PostgreSQL	La aplicación debe funcionar sin DB
Caché	Caché en proceso con TTL/LRU y claves por hash	Reutilizar resultados de cálculos costosos
Snapshot	CSV comprimido y modelos versionados dentro del despliegue	Demo reproducible y sin dependencia de servicios externos
Entrenamiento	Offline, mediante comandos Python	No cargar entrenamiento pesado en funciones serverless
Despliegue	Vercel	Frontend y API en el mismo proyecto si la configuración disponible lo permite
CI	GitHub Actions	Pruebas, lint, tipos, cobertura e idempotencia


4.1 Consideración sobre Vercel y FastAPI
FastAPI puede ejecutarse como función Python/ASGI en Vercel cuando la estructura y configuración del proyecto sean compatibles con el runtime vigente. Antes de cerrar la arquitectura de despliegue, se debe validar con un prototipo mínimo:
1. Next.js responde en /.
2. FastAPI responde en /api/health o en la ruta asignada al backend.
3. La función Python puede importar las dependencias de serving.
4. El snapshot y los artefactos .joblib quedan incluidos en el bundle.
5. Las rutas funcionan tanto en preview como en producción.
No se debe asumir que una configuración antigua de vercel.json, una característica beta o Vercel Services está habilitada en todos los planes. Se debe comprobar la documentación y el panel del proyecto en el momento del despliegue.

Plan B: frontend y backend como dos proyectos de Vercel. El frontend usa una variable API_BASE_URL para llamar al backend. Esto no obliga a contratar una base de datos ni otro servicio de persistencia.
5. Arquitectura: monolito modular
5.1 Idea
Un solo sistema, dividido en módulos por dominio con fronteras claras. Los módulos no conocen los detalles internos de otros módulos: se comunican mediante su fachada pública (api.py). Los workflows componen varios módulos para resolver un caso de uso.

La capa HTTP traduce solicitudes y respuestas; no contiene reglas de negocio.
Browser
  |
  v
Next.js (App Router)
  |-- UI / pages / components
  |-- Route Handlers (proxy opcional)
  |
  v
FastAPI (JSON / OpenAPI)
  |
  v
orchestration/ (workflows)
  |
  +--> catalog
  +--> performance
  +--> modeling
  +--> experiments
  +--> attribution
  +--> budget
  |
  v
kernel/ (tipos, métricas, hashing, errores)
  |
  v
platform/ (adaptadores)
  |-- storage: memory / snapshot / SQLite / PostgreSQL
  |-- cache: TTL / LRU
  |-- persistence: outbox best-effort / sync
  |-- web: FastAPI routes / schemas
Los módulos de dominio pueden importar librerías numéricas (pandas, numpy, scipy, scikit-learn). No pueden importar infraestructura (FastAPI, SQLAlchemy, Vercel ni platform/). El I/O se realiza a través de puertos.
5.2 Estructura propuesta
pitaya/
├── frontend/              # FRONTEND.md (diseño + contrato API §0)
│   ├── package.json
│   ├── next.config.ts
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── campaigns/
│   │   │   ├── models/
│   │   │   ├── roi/
│   │   │   ├── experiments/
│   │   │   ├── attribution/
│   │   │   ├── budget/
│   │   │   └── status/
│   │   ├── api/                 # Route Handlers proxy opcionales
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   │   ├── api/                 # Cliente generado OpenAPI
│   │   └── utils/
│   └── ...
├── backend/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── requirements.txt         # dependencias de serving para Vercel
│   ├── app/
│   │   └── index.py             # entrypoint ASGI: app = create_app()
│   ├── snapshot/
│   │   ├── ads.csv.gz
│   │   ├── models/
│   │   │   ├── rf.joblib
│   │   │   └── ada.joblib
│   │   └── manifest.json
│   ├── migrations/              # Alembic, solo si se usa SQL
│   ├── tests/
│   └── src/
│       └── pitaya/
│           ├── kernel/
│           ├── modules/
│           │   ├── catalog/
│           │   ├── performance/
│           │   ├── modeling/
│           │   ├── experiments/
│           │   ├── attribution/
│           │   └── budget/
│           ├── orchestration/
│           └── platform/
│               ├── storage/
│               │   ├── memory.py
│               │   ├── snapshot.py
│               │   ├── sqlite.py
│               │   ├── postgres.py
│               │   └── factory.py
│               ├── cache/
│               │   └── memory.py
│               ├── sync/
│               │   ├── outbox.py
│               │   └── service.py
│               └── web/
│                   ├── app.py
│                   ├── routes.py
│                   └── schemas.py
├── data/                         # local only; no production writes here
├── notebooks/                    # EDA and experiments
├── Makefile
├── vercel.json
├── AGENTS.md
└── README.md
La estructura puede ajustarse al layout exacto requerido por Vercel. Mantener frontend/ y backend/ separados permite instalar y construir cada runtime con sus propias dependencias.
5.3 Forma interna de cada módulo
modules/budget/
├── api.py        # única puerta pública
├── domain.py     # lógica de negocio pura
├── ports.py      # Protocols requeridos para I/O, si aplica
└── _internal/    # detalles privados del módulo
5.4 Reglas de dependencias
1. modules/* no importan platform/ ni orchestration/.
2. Un módulo solo puede importar de otro su api.py, nunca domain.py ni _internal/.
3. kernel/ no importa de ningún módulo de dominio.
4. orchestration/ solo usa las fachadas públicas de los módulos y los puertos.
5. platform/web/ solo llama a orchestration/.
6. El frontend no implementa reglas analíticas: consume contratos de la API.
Estas reglas se verifican en CI con import-linter para Python y lint/type-check para TypeScript.
5.5 Orquestadores en vez de controladores de negocio
Un workflow recibe un contexto (fachadas de módulos, repositorios, caché y reloj) y un comando. Coordina el caso de uso sin conocer HTTP.

Ejemplo conceptual:
def recommend(ctx: Context, cmd: RecommendCmd) -> RecommendationView:
    dataset = ctx.catalog.current()
    segments = ctx.performance.segment_stats(dataset)
    plan = ctx.budget.allocate(
        segments,
        cmd.budget,
        cmd.constraints,
    )
    recommendation = ctx.budget.record(
        plan,
        key=cmd.idempotency_key,
    )
    ctx.persistence.save_if_available(
        recommendation.as_record()
    )
    return RecommendationView.from_domain(recommendation)
Las rutas FastAPI validan el request, llaman al workflow y traducen el resultado a HTTP. No deben contener fórmulas de ROI, lógica de modelos ni algoritmos de asignación.
5.6 Principios
- SOLID: responsabilidad clara por módulo y dependencia de puertos.
- KISS: sin microservicios, Redis, colas externas ni infraestructura que no aporte al alcance académico.
- DRY: KPIs en un único módulo; esquemas HTTP en la capa web; persistencia SQL encapsulada en adaptadores.
- Regla de dos usos: no crear abstracciones genéricas antes de tener al menos dos usos reales.
- Sin promesas falsas de durabilidad: memoria y caché son temporales; SQLite/PostgreSQL son los adaptadores de persistencia durable.
6. Persistencia y caché: memoria primero
6.1 Objetivo
La aplicación debe iniciar y ofrecer las funcionalidades analíticas aunque no haya una base de datos configurada. La información necesaria para la demo (dataset de muestra y modelos entrenados) se empaqueta como snapshot de solo lectura.

La memoria se utiliza para:
- Cachear KPIs, tablas y resultados de modelos.
- Mantener temporalmente el estado de la instancia.
- Evitar recalcular operaciones con los mismos datos y parámetros.
- Recibir escrituras temporales durante la sesión.
La memoria no se considera almacenamiento durable.
6.2 Niveles de lectura
Nivel	Componente	Ubicación	Responsabilidad
L1	Caché de proceso (dict con TTL/LRU)	RAM de la instancia	Respuestas rápidas y resultados calculados
L2	Snapshot versionado	Archivos incluidos en el despliegue	Dataset y modelos disponibles sin DB
L3	Repositorio SQL opcional	SQLite local o PostgreSQL configurado	Persistencia durable de escrituras


Orden de lectura recomendado:
1. Consultar caché L1.
2. Si es un recurso de demo, cargar desde snapshot L2.
3. Si se trata de un registro persistido, consultar L3 cuando esté configurado.
4. Guardar en caché el resultado obtenido cuando corresponda.
La fuente de datos analíticos de la demo es el snapshot versionado. Si hay base de datos, se utiliza para el estado mutable (por ejemplo, recomendaciones guardadas o experimentos creados), no como requisito para leer el dataset base.
6.3 Caché
Las operaciones puras (KPIs, ROI, atribución, resultados de A/B y recomendaciones derivadas) se cachean mediante una clave determinista:
cache_key = hash(dataset_hash + operation + normalized_parameters)
Si cambia el dataset o un parámetro, cambia la clave. La caché tendrá TTL y un límite de tamaño para no crecer indefinidamente.

La caché se puede vaciar en cualquier momento sin afectar la corrección del sistema: el resultado se vuelve a calcular desde el snapshot y/o la base de datos.
6.4 Escrituras y sincronización oportunista
Las escrituras se reciben primero en memoria para que el flujo de la aplicación no dependa de una base de datos disponible. Después se intenta persistirlas si existe un repositorio SQL configurado.
def save_record(record):
    memory_store.put(record.key, record)

    if not database_configured():
        return SaveReport(
            saved_in_memory=True,
            persisted=False,
            reason="database_not_configured",
        )

    try:
        repository.upsert(record)
        return SaveReport(
            saved_in_memory=True,
            persisted=True,
        )
    except DatabaseUnavailable:
        pending_outbox.add(record)
        return SaveReport(
            saved_in_memory=True,
            persisted=False,
            reason="database_unavailable",
        )
La outbox en memoria permite reintentar escrituras pendientes mientras viva el proceso. Si el proceso termina, esa outbox también se pierde. Por ello:
- En local, se puede ejecutar un worker/hilo de sincronización y un flush al apagar la aplicación.
- En Vercel, no se debe depender de hilos persistentes, tareas de fondo ni timers entre peticiones.
- En Vercel con DB, se intenta el upsert durante la misma petición que realiza la escritura, con timeout corto.
- Si falla la DB, se conserva el dato en RAM como estado temporal y se informa al usuario de que no quedó persistido.
- La siguiente petición puede reintentar las escrituras pendientes de la misma instancia, pero no se garantiza que llegue a ejecutarse ni que use la misma instancia.
- Sin DB, la interfaz debe indicar claramente “Modo demo: los cambios no tienen persistencia permanente”.
No se debe mostrar “guardado” sin distinguir entre guardado temporal en memoria y persistido en base de datos.
6.5 Idempotencia
Los endpoints que crean recomendaciones o guardan resultados aceptan Idempotency-Key.
- Misma clave y mismo cuerpo: devolver el resultado existente.
- Misma clave y cuerpo diferente: responder 409 Conflict.
- En SQL: índice único por clave y upsert transaccional.
- En memoria: diccionario por clave, válido únicamente durante la vida del proceso.
En modo memory, la idempotencia no sobrevive a reinicios ni se comparte entre instancias. La garantía durable solo existe cuando la base de datos confirma la escritura.
6.6 SQLite y PostgreSQL
Criterio	SQLite	PostgreSQL
Instalación	Archivo local, sin servidor	Servidor local o proveedor remoto
Uso principal	Desarrollo y pruebas locales	Persistencia compartida y despliegues con DB
Concurrencia	Adecuado para uso local y baja concurrencia de escritura	Mejor opción para concurrencia y múltiples instancias
Vercel	No usar como archivo durable del despliegue	Usar solo si se configura un servidor PostgreSQL externo
Requisito	Ninguno adicional	DATABASE_URL


Decisión recomendada: SQLite como opción local por defecto. PostgreSQL queda soportado como alternativa de producción, pero no se exige ni se provisiona automáticamente. Para desplegar PITAYA en Vercel sin servicios externos, se utiliza memory + snapshot.

En Vercel, el filesystem del bundle no debe tratarse como almacenamiento persistente de escritura. /tmp, cuando esté disponible, es temporal y no sustituye una base de datos. No se debe intentar escribir el archivo SQLite dentro del despliegue para conservar cambios.

Se puede utilizar SQLAlchemy 2.0 para compartir modelos y repositorios entre SQLite y PostgreSQL. Si el alcance no necesita SQL todavía, se puede implementar primero el contrato del repositorio y añadir los adaptadores SQL cuando se requieran. Alembic solo se usa para los modos SQL.
6.7 Configuración por entorno
Ejemplo de variables:
# memory | sqlite | postgres | auto
STORAGE_MODE=auto

# Opcional. Si no existe, se usa memory.
DATABASE_URL=

CACHE_TTL_SECONDS=900
CACHE_MAX_ITEMS=256
SNAPSHOT_DIR=backend/snapshot
SYNC_TIMEOUT_SECONDS=2
Comportamiento de auto:
1. Si existe DATABASE_URL y la conexión funciona, selecciona el adaptador correspondiente.
2. Si no hay URL o la conexión no está disponible, inicia en modo memory.
3. Expone el modo activo y el estado de persistencia en /v1/status.
En producción, es preferible configurar explícitamente STORAGE_MODE=memory cuando se quiera una demo sin DB, para evitar intentos de conexión innecesarios.
7. Snapshot y modelos
1. make train entrena offline y escribe en backend/snapshot/: models/rf.joblib, models/ada.joblib, ads.csv.gz y manifest.json.
2. El manifiesto registra dataset_hash, config_hash, git_sha, versión de scikit-learn, semilla, métricas y esquema de features.
3. Al arrancar, la aplicación carga el snapshot de forma perezosa. Los modelos se cargan en la primera predicción.
4. Se valida que la versión de scikit-learn del runtime coincida con la versión registrada en el manifiesto. Si no coincide, /status informa el problema.
5. Mantener modelos pequeños (n_estimators moderado, max_depth acotado y joblib.dump(..., compress=3)).
6. El proceso de serving no descarga datasets ni entrena modelos.
7. Evitar dependencias pesadas que no sean necesarias para predecir y consultar resultados.
El snapshot es de solo lectura en el despliegue y permite que la demo analítica funcione sin base de datos ni servicios externos.
8. Idempotencia y reproducibilidad del pipeline
Ejecutar una etapa dos veces con las mismas entradas y configuración debe producir los mismos artefactos y no duplicar registros.
Mecanismo	Implementación
Huellas de entrada	SHA-256 del dataset y de la configuración
Manifiesto por etapa	stage, input_hash, config_hash, git_sha, seed, output_hash
Caché de etapas	Si el manifiesto coincide, se omite la etapa; --force la ejecuta de nuevo
run_id	Hash determinista de entradas, configuración y versión de código
Semilla	Una semilla configurada para split, CV, modelos y simulaciones
Partición	Test por hash estable de ad_id, por ejemplo hash(ad_id) % 10 < 2
Orden	Orden estable antes de agrupar, entrenar o escribir
Archivos	Escrituras atómicas en entorno local
SQL	Upsert por clave natural
API	Idempotency-Key para POST que guardan estado


Pruebas en tests/idempotency/:
- Pipeline dos veces con hashes idénticos.
- Reingesta sin cambiar el conteo.
- Filas barajadas con el mismo split y métricas reproducibles.
- Mismo POST con la misma clave produce un solo registro SQL.
- Flush repetido sin duplicados.
- En modo memory, validar idempotencia dentro de una misma instancia y documentar que no sobrevive a reinicios.
Comando: make verify-idempotent.
9. Protocolo de modelado
1. EDA: notebook de análisis, separado de la lógica de producción. Revisar balance de clases, ceros, outliers de gasto y diferencias por campaña, edad, género e interés.
2. Pipeline: ColumnTransformer de scikit-learn. Todo preprocesamiento se ajusta solo con datos de entrenamiento. Edad ordinal; género, campaña e interés con codificación adecuada.
3. Partición: test reservado mediante hash de ad_id; dentro del entrenamiento, CV estratificada repetida (por ejemplo, 5×3).
4. Modelos: DummyClassifier, LogisticRegression, RandomForestClassifier y AdaBoostClassifier, con búsqueda de hiperparámetros y semilla fija.
5. Métricas: ROC-AUC, PR-AUC, F1, precisión, recall, Brier y calibración. Seleccionar umbral en CV, nunca en test. Calcular intervalos mediante bootstrap.
6. Comparación RF vs AdaBoost: puntajes por pliegue pareados con Wilcoxon o prueba remuestreada apropiada.
7. Calibración: CalibratedClassifierCV cuando esté justificado.
8. Explicabilidad: permutation importance y SHAP durante el entrenamiento, no en el runtime de Vercel salvo que se demuestre que el coste y el bundle son aceptables.
9. Reporte: guardar métricas y configuración en snapshot/ y mostrarlas en la página de modelos.
Evitar:
- Fuga con Total_Conversion.
- Ajustar preprocesamiento antes de dividir los datos.
- Elegir umbral con el conjunto de test.
- Reportar solo accuracy.
- Presentar resultados de entrenamiento como si fueran resultados de test.
10. Analytics de negocio
ROI
Ingreso estimado:
estimated_revenue = Approved_Conversion * value_per_approved_conversion
KPIs por campaña, edad, género e interés: CTR, CVR, CPC, CPM, CPA, ROAS y ROI. Incluir sensibilidad frente al valor configurable por conversión y punto de equilibrio. La UI debe aclarar que los ingresos son estimados, no observados en el dataset.
A/B testing
- Comparar campañas 916, 936 y 1178 en CTR, CVR y CPA.
- Etiquetar el análisis como observacional, no como experimento aleatorizado.
- Prueba z de dos proporciones cuando se cumplan sus supuestos.
- Tamaño del efecto e intervalos de confianza.
- Corrección de Holm para comparaciones múltiples.
- Modelo Beta-Binomial bayesiano.
- Bootstrap para CPA.
- Simulador de tamaño de muestra y duración bajo supuestos explícitos.
Atribución
- Nivel A: Shapley exacto propio sobre factores disponibles (por ejemplo, campaña, edad, género e interés), con 16 coaliciones para cuatro factores. Mostrar contribución marginal por exclusión.
- Nivel B: first touch, last touch, linear, time decay, position based y Markov sobre trayectorias sintéticas con semilla fija. La interfaz debe mostrar “Datos simulados” de forma visible.
Canales
Tabla y gráficos de eficiencia (CPA, ROAS) y volumen por campaña y segmento. El dataset actual solo representa Facebook; no inventar canales adicionales ni mostrar datos sintéticos como reales.
Recomendación de inversión
- Construir segmentos por campaña × edad × género × interés, con mínimo de observaciones.
- Aplicar encogimiento Beta-Binomial.
- Modelar curva de respuesta cóncava, por ejemplo conversions = a * spend ** b, con b < 1.
- Asignar presupuesto mediante algoritmo voraz determinista de retorno marginal.
- Respetar restricciones min_share y max_share.
- Mostrar ROI esperado, intervalo de incertidumbre y comparación con la distribución actual.
- Indicar que se trata de una recomendación basada en datos observacionales y supuestos del modelo.
11. API y páginas
11.1 API FastAPI
Prefijo /v1:
Método	Endpoint	Uso
GET	/health	Disponibilidad del proceso
GET	/status	Modo de almacenamiento, snapshot, caché y estado de persistencia
GET	/kpis	KPIs generales
GET	/segments	Rendimiento por segmentos
POST	/predict	Predicción de conversión
POST	/ab-test	Comparación de campañas
GET	/attribution?model=	Resultados de atribución
GET	/channels/compare	Comparación por dimensión de canal disponible
POST	/recommendations	Generar y guardar recomendación; acepta Idempotency-Key
GET	/recommendations	Consultar recomendaciones persistidas, si hay DB
POST	/admin/sync	Reintentar sincronización de outbox en memoria


FastAPI genera OpenAPI y documentación interactiva en /docs (deshabilitable en producción si se considera necesario).
11.2 Next.js
Páginas propuestas:
1. Resumen de KPIs.
2. Campañas y segmentos.
3. Modelos: métricas, ROC/PR, calibración, importancia y comparación RF vs AdaBoost.
4. ROI y sensibilidad.
5. A/B testing y simulador.
6. Atribución: Nivel A y Nivel B.
7. Comparación de canales.
8. Recomendador de inversión: presupuesto, restricciones y comparación con reparto actual.
9. What-if: probabilidad de convertir de un anuncio hipotético.
10. Estado del sistema: modo activo, caché, snapshot y persistencia.
La UI consume FastAPI mediante el cliente TypeScript generado desde OpenAPI. Los Route Handlers de Next.js pueden actuar como proxy para centralizar el origen y evitar que el navegador necesite conocer la dirección interna del backend.
11.3 Estado visible para el usuario
La página /status debe diferenciar claramente:
- Modo de almacenamiento: memory, SQLite o PostgreSQL.
- Persistencia: disponible, no configurada o temporalmente no disponible.
- Snapshot: cargado y hash del dataset.
- Caché: número de entradas y TTL configurado.
- Escrituras: persistidas, pendientes en memoria o no persistibles.
- Último intento de sincronización: fecha y resultado, si aplica.
No mostrar una escritura como persistida cuando solo existe en RAM.
12. Despliegue y ejecución
12.1 Desarrollo local
Requisitos recomendados:
- Node.js LTS compatible con la versión elegida de Next.js.
- Python 3.12.
- uv para gestionar el entorno Python.
- pnpm para el frontend.
Arranque inicial:
# Backend
cd backend
uv sync
uv run uvicorn app.index:app --reload --port 8000

# Frontend, en otra terminal
cd frontend
pnpm install
pnpm dev
Configurar en frontend/.env.local:
API_BASE_URL=http://localhost:8000
Para usar SQLite local:
STORAGE_MODE=sqlite
DATABASE_URL=sqlite:///./data/pitaya.db
Para ejecutar sin base de datos:
STORAGE_MODE=memory
El modo memory no requiere Docker, PostgreSQL, Redis ni otro servicio externo.
12.2 Vercel sin servicios externos (modo objetivo de demo)
1. Conectar el repositorio a Vercel.
2. Configurar el root/build según la estructura monorepo y el runtime Python soportado en ese momento.
3. Desplegar Next.js y FastAPI según la integración disponible. Validar primero un endpoint mínimo de FastAPI.
4. Configurar STORAGE_MODE=memory.
5. Configurar SNAPSHOT_DIR con la ruta real incluida en el bundle.
6. Incluir únicamente dependencias necesarias para serving.
7. Verificar que ads.csv.gz, manifest.json y los modelos queden incluidos en la función Python.
8. Probar /health, /status, /docs y las páginas principales.
9. Verificar la demo desde una ventana privada y desde un preview de PR.
En este modo:
- El dataset y los modelos vienen empaquetados.
- Las lecturas y cálculos funcionan sin servicios externos.
- La caché es local a cada instancia.
- Las escrituras son temporales y pueden perderse.
- No se promete sincronización futura porque no hay una base de datos configurada.
12.3 Vercel con PostgreSQL opcional
Si posteriormente se necesita persistencia compartida:
1. Configurar una instancia PostgreSQL y obtener DATABASE_URL.
2. Establecer STORAGE_MODE=postgres.
3. Ejecutar migraciones Alembic como tarea controlada, no al importar la aplicación.
4. Usar pool/conexiones adecuados para funciones serverless.
5. Mantener timeouts cortos y manejar fallos de conexión.
6. Hacer upsert durante la petición de escritura.
7. Si la DB falla, informar que el dato solo quedó temporalmente en memoria.
PostgreSQL puede ser local durante desarrollo o remoto en producción. La aplicación no debe depender de Neon ni de un proveedor específico.
12.4 SQLite en Vercel
No utilizar SQLite como almacenamiento persistente en Vercel. El archivo de la aplicación no es un volumen durable y compartido; /tmp es temporal. SQLite se reserva para desarrollo local y pruebas.
12.5 Configuración Vercel
La configuración exacta depende del runtime Python, del monorepo y de las características habilitadas en la cuenta. No copiar una configuración antigua sin validarla.

Como parte del primer despliegue, verificar:
- Root Directory y comandos de build.
- Detección del entrypoint ASGI.
- Inclusión de snapshot/**.
- Dependencias instaladas en la función Python.
- Rutas y rewrites entre Next.js y FastAPI.
- Tamaño final del bundle.
- Duración y memoria permitidas para el plan.
Si no se puede ejecutar Next.js y FastAPI bajo un único proyecto con la configuración disponible, usar dos proyectos Vercel. Es preferible un despliegue verificable a depender de una función beta no disponible.
12.6 Límites operativos
Los límites de tamaño, memoria, duración, runtime y disponibilidad de características de Vercel cambian por plan y fecha. No fijar cifras en esta guía como si fueran permanentes. Antes de desplegar, consultar la documentación oficial vigente y comprobar el plan real.

Mantener las peticiones web cortas. No ejecutar EDA, entrenamiento, SHAP costoso ni búsquedas de datasets en una función serverless. Precalcular y versionar esos resultados.
12.7 Plan B
Si el runtime Python, el tamaño del bundle o la integración conjunta presentan problemas, mantener el mismo código y desplegar el backend en un entorno compatible con ASGI y el frontend en Vercel. Esta alternativa no cambia el diseño de dominio ni obliga a añadir una base de datos.
13. Estado del proyecto

**Hecho (backend y datos)**

- Repositorio, `Makefile`, CI en GitHub Actions, Python 3.12 + uv, FastAPI `/v1` y OpenAPI.
- Descarga Kaggle (`make download`), ingest con limpieza y snapshot, entrenamiento offline (`make train`), manifiesto y modelos en `backend/snapshot/`.
- Módulos y workflows: KPIs, segmentos, ROI, modelos, A/B (Holm + bayesiano), atribución A/B, recomendador con idempotencia, `/status`, sync best-effort.
- Memoria por defecto; SQLite opcional para recomendaciones; tests con cobertura ≥80 %.

**Pendiente (producto)**

- **Frontend:** implementar las pantallas y el shell descritos en [frontend/FRONTEND.md](./frontend/FRONTEND.md) (consumo de la API, tokens, estados honestos). El scaffold Next.js ya existe; no hay dashboard.

**Opcional (no bloquea el backend local)**

- Deploy público en Vercel (memory mode).
- PostgreSQL en producción.
- Notebook EDA ejecutado y narrativa para informe (`notebooks/01_eda.ipynb`).


14. Cómo usar IA para desarrollar sin perder el control
14.1 AGENTS.md
Copiar estas reglas a AGENTS.md en la raíz:
# Reglas del proyecto PITAYA

## Stack
- Frontend: Next.js App Router, TypeScript, pnpm.
- Backend: Python 3.12, FastAPI, Pydantic y uv.
- Comunicación mediante API JSON documentada con OpenAPI.
- No introducir servicios externos obligatorios.

## Arquitectura
- Monolito modular: modules/ (dominio), orchestration/ (workflows),
  platform/ (infraestructura) y kernel/ (compartido).
- modules/* pueden importar pandas, numpy, scipy y sklearn,
  pero NO FastAPI, SQLAlchemy ni platform/.
- Entre módulos solo se importa api.py.
- Las rutas FastAPI validan y delegan; no contienen lógica de negocio.
- El frontend no replica cálculos del backend.

## Persistencia
- La aplicación debe funcionar en STORAGE_MODE=memory.
- SQLite se usa para desarrollo local.
- PostgreSQL es opcional y se activa mediante DATABASE_URL.
- La memoria y la caché son temporales; no afirmar que son persistentes.
- En Vercel no depender de workers, hilos o timers para sincronización.
- Si hay DB, intentar persistir en la misma petición.
- Mostrar al usuario si un dato está solo en memoria o persistido.

## Datos y modelos
- Dataset y modelos de demo se cargan desde snapshot/.
- Entrenamiento offline; no entrenar durante requests.
- Prohibido usar Total_Conversion como feature para predecir
  Approved_Conversion.
- Preprocesamiento dentro de Pipeline de scikit-learn.
- Todo dato simulado debe identificarse como simulado.

## Calidad
- Type hints en Python y tipos estrictos en TypeScript.
- Ruff, mypy, ESLint y pruebas automatizadas.
- Toda función pública lleva pruebas, incluidos casos negativos.
- No agregar dependencias pesadas al runtime sin justificarlo.
- Textos de interfaz en español; código y nombres técnicos en inglés.
- Preferir soluciones simples y comprensibles para el equipo.
14.2 Flujo por tarea
Rama pequeña por tarea → entregar a la IA AGENTS.md, la fachada pública del módulo y los archivos necesarios → pedir pruebas primero → ejecutar formatters, linters, type-check y tests → revisar manualmente lo generado → PR pequeño con revisión cruzada.
14.3 Prompt de ejemplo
Contexto: PITAYA es un sistema de minería de datos sobre Facebook Ads.
Stack: Next.js + FastAPI. Arquitectura de monolito modular.
La aplicación debe funcionar en Vercel sin servicios externos,
usando snapshot y almacenamiento temporal en memoria.

Adjunto AGENTS.md y los archivos relevantes del módulo.

Tarea: implementar el workflow de recomendación de presupuesto.

Restricciones:
- Usar únicamente las api.py públicas de los módulos.
- No introducir lógica HTTP en el workflow.
- No asumir que hay una base de datos disponible.
- Guardar temporalmente en memoria y persistir si hay DB disponible.
- No afirmar que una escritura en memoria es durable.
- Mantener resultados deterministas.
- No agregar dependencias sin justificarlo.

Pruebas:
- Mismo input y seed producen la misma recomendación.
- La operación funciona sin DB.
- Si hay SQLite/PostgreSQL, persiste correctamente.
- Si la DB falla, el resultado informa que no quedó persistido.
14.4 Trampas típicas
- Importar FastAPI o SQLAlchemy dentro de un módulo de dominio.
- Escribir en el filesystem del despliegue esperando persistencia.
- Usar SQLite como si fuera durable en Vercel.
- Tratar la RAM de una función serverless como caché compartida.
- Crear workers o timers en Vercel para sincronizar datos posteriormente.
- Afirmar que una escritura está guardada cuando solo está en memoria.
- Incluir pandas/SHAP/notebooks o dependencias de entrenamiento innecesarias en serving.
- Entrenar modelos durante una petición.
- Hacer fit del preprocesamiento con todos los datos.
- Presentar datos simulados como reales.
15. Calidad y CI
En cada PR:
# Backend
cd backend
uv sync
uv run ruff check .
uv run ruff format --check .
uv run mypy src
uv run lint-imports
uv run pytest --cov=pitaya --cov-fail-under=80

# Frontend
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
Además:
- make verify-idempotent.
- Pruebas de repositorio contra SQLite.
- Pruebas de PostgreSQL cuando el entorno CI tenga un servicio PostgreSQL configurado.
- Prueba de arranque sin DATABASE_URL.
- Prueba de fallo de DB y reporte de persistencia temporal.
- Verificación del tamaño de artefactos y dependencias de serving.
No hacer que el CI dependa de credenciales de producción. PostgreSQL puede levantarse como servicio de CI solo para esa suite.
16. Definition of Done (resumen)

Cierre **backend:** cumplido (ver §13). Cierre **producto completo:** falta el frontend según `frontend/FRONTEND.md` (Definition of Done de interfaz en la sección 18 de ese archivo).

17. Sustentación y hoja de vida
Preguntas probables
1. ¿Por qué un monolito modular y no microservicios?
2. ¿Cómo se imponen las fronteras entre módulos?
3. ¿Por qué separar workflows de las rutas HTTP?
4. ¿Por qué la aplicación funciona sin base de datos?
5. ¿Cuál es la diferencia entre caché, memoria temporal, snapshot y persistencia SQL?
6. ¿Por qué la memoria de Vercel no puede considerarse almacenamiento durable?
7. ¿Cómo se comporta PITAYA cuando PostgreSQL no está disponible?
8. ¿Por qué SQLite se reserva para desarrollo local?
9. ¿Por qué Total_Conversion no puede ser una feature?
10. ¿Qué demuestra la comparación estadística entre RF y AdaBoost?
11. ¿Por qué el A/B es observacional y la atribución Nivel B es simulada?
12. ¿Cómo se prueba la idempotencia?
Descripción para CV (ajustar solo a lo realmente implementado)
Diseñé e implementé PITAYA, una plataforma de analítica y optimización de inversión publicitaria sobre datos de Facebook Ads, con frontend Next.js y API FastAPI bajo una arquitectura de monolito modular. Integra modelos de conversión Random Forest y AdaBoost, análisis de ROI, pruebas A/B frecuentistas y bayesianas, atribución mediante valores de Shapley y recomendación de presupuesto con retornos decrecientes. Implementa procesamiento offline, artefactos versionados, caché en memoria y persistencia opcional con SQLite/PostgreSQL, con despliegue en Vercel sin dependencias externas obligatorias.

No incluir en el CV tecnologías, métricas o funcionalidades que no estén implementadas y probadas.
18. Riesgos y mitigaciones
Riesgo	Mitigación
Runtime Python o integración Vercel no compatible con la estructura	Validar un prototipo mínimo al inicio; usar dos proyectos Vercel como plan B
Bundle demasiado grande	Separar dependencias de train y serve; excluir notebooks, tests y datos crudos
Memoria perdida al reciclar instancia	No tratar RAM como persistencia; usar snapshot para demo y DB opcional para estado durable
Outbox en memoria perdida	En Vercel, intentar persistencia dentro de la petición; informar si no se confirmó
Ausencia de DB en demo	Ejecutar en memory mode con dataset y modelos incluidos
Arranque en frío	Snapshot pequeño, carga perezosa y peticiones cortas
Versión de scikit-learn distinta	Pin exacto y validación contra manifest
Funciones serverless con límites de duración	Precalcular modelos y estadísticas costosas
Dataset pequeño	CV repetida, intervalos, baselines y limitaciones explícitas
Sobreingeniería	Sin microservicios, Redis ni colas externas; abstraer solo cuando haya dos usos
Código generado por IA que el equipo no comprende	Revisión cruzada, pruebas y lectura antes de cada merge


Mantra del equipo: módulos aislados, memoria que acelera, snapshot que permite la demo y base de datos opcional para persistencia durable.