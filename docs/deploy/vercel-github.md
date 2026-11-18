# Despliegue automático en Vercel desde GitHub

Guía para **Nicolás** (dueño de `Nicolas-12000/PITAYA`) y **Juan Camilo** (dueño del proyecto en Vercel). Al terminarla, cada push a `main` despliega PITAYA en producción sin pasos manuales.

## Resumen

| Dato | Valor |
|------|-------|
| Repositorio | `Nicolas-12000/PITAYA` (público, cuenta personal de Nicolás) |
| Proyecto de Vercel | `pitaya`, en el equipo `juan-camilo-martinezs-projects` (plan Hobby, cuenta de Juan Camilo) |
| URL de producción | https://pitaya-nine.vercel.app |
| Cómo se despliega | GitHub Actions ejecuta la CLI de Vercel en cada push a `main` |
| Tiempo estimado | 10 minutos en total |

## Por qué así y no con el botón «Connect Git Repository»

La integración nativa de Vercel con GitHub es una **GitHub App**. En un repositorio de una cuenta personal, solo el dueño de esa cuenta puede instalar apps, y Juan Camilo es colaborador (permiso `push`, no `admin`). Por eso, al crear el proyecto, Vercel no pudo enlazar el repositorio.

La alternativa que no exige mover el proyecto ni cambiar la URL es un workflow de GitHub Actions que despliega con un token de la cuenta de Juan Camilo. Nicolás solo tiene que guardar tres *secrets* en el repo, algo que únicamente el dueño puede hacer.

```
push a main ──► GitHub Actions (repo de Nicolás)
                   │  usa VERCEL_TOKEN de Juan Camilo
                   ▼
              Vercel: proyecto "pitaya" (cuenta de Juan Camilo)
                   │  build remoto: Next.js + FastAPI (vercel.json)
                   ▼
              https://pitaya-nine.vercel.app
```

## Quién hace qué

| Paso | Quién | Qué |
|------|-------|-----|
| 1 | Juan Camilo | Crea un token de Vercel y se lo pasa a Nicolás por un canal privado |
| 2 | Nicolás | Guarda tres *secrets* en el repositorio |
| 3 | Juan Camilo o Nicolás | Sube el workflow `.github/workflows/vercel.yml` |
| 4 | Cualquiera | Lanza el workflow una vez y comprueba el sitio |

---

## Paso 1 — Crear el token de Vercel (Juan Camilo)

1. Entra a https://vercel.com/account/settings/tokens con la cuenta dueña del proyecto.
2. Pulsa **Create Token** y completa:
   - **Token name:** `github-actions-pitaya`
   - **Scope:** `juan-camilo-martinezs-projects` (el equipo donde vive el proyecto; no elijas otro).
   - **Expiration:** la fecha de entrega del proyecto o 90 días. Evita «No Expiration».
3. Copia el token. Vercel solo lo muestra una vez.
4. Pásalo a Nicolás por un canal privado (mensaje directo o gestor de contraseñas). **Nunca** lo pegues en el repositorio, en un issue, en un commit ni en un chat de grupo.

> Si el token se filtra, revócalo en esa misma página y crea otro. Luego Nicolás actualiza el *secret* del paso 2.

## Paso 2 — Guardar los secrets en GitHub (Nicolás)

Solo el dueño del repositorio ve esta configuración.

1. Abre https://github.com/Nicolas-12000/PITAYA/settings/secrets/actions
   (o **Settings → Secrets and variables → Actions**).
2. En la pestaña **Secrets**, pulsa **New repository secret** tres veces y crea:

| Name | Secret |
|------|--------|
| `VERCEL_TOKEN` | El token que te pasó Juan Camilo |
| `VERCEL_ORG_ID` | `team_xztOQAdEd7ji6dGBmHeEELsw` |
| `VERCEL_PROJECT_ID` | `prj_z0GS40imI5kLnGBE7o3bnCDmoUck` |

Los dos IDs no son secretos, pero guardarlos junto al token deja la configuración en un solo lugar. Salen de `.vercel/project.json`, que la CLI genera al enlazar el proyecto y que no se sube al repo.

3. Comprueba que Actions está habilitado: **Settings → Actions → General → Actions permissions** debe permitir acciones (por ejemplo, «Allow all actions and reusable workflows»).

## Paso 3 — Añadir el workflow (Juan Camilo o Nicolás)

Crea el archivo `.github/workflows/vercel.yml` con este contenido y súbelo a `main`. Juan Camilo puede hacerlo con su permiso de `push`.

```yaml
name: vercel

on:
  push:
    branches: [main]
    paths-ignore:
      - "docs/**"
      - "notebooks/**"
      - "**/*.md"
  workflow_dispatch:

# Un solo despliegue de producción a la vez; si llega otro push, cancela el anterior.
concurrency:
  group: vercel-production
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Instalar la CLI de Vercel
        run: npm install --global vercel@latest

      - name: Desplegar a producción
        run: vercel deploy --prod --yes --token="${{ secrets.VERCEL_TOKEN }}"
```

Qué hace cada parte:

- **`paths-ignore`:** no despliega si el push solo cambia documentación o notebooks.
- **`workflow_dispatch`:** añade un botón para desplegar a mano desde la pestaña Actions.
- **`VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`:** le dicen a la CLI a qué proyecto desplegar sin un `.vercel/` en el repo.
- **`vercel deploy --prod`:** sube el código y Vercel hace el build remoto según `vercel.json` (Next.js en `frontend/`, FastAPI en `backend/`). El runner no necesita Python ni pnpm.

El build respeta `.vercelignore`, que ya excluye `.env`, bases locales, `node_modules`, `.venv` y las pruebas.

## Paso 4 — Probar

1. Ve a https://github.com/Nicolas-12000/PITAYA/actions, elige **vercel** y pulsa **Run workflow** sobre `main`.
2. El paso «Desplegar a producción» debe terminar en verde y mostrar la URL del despliegue y la de producción (`https://pitaya-nine.vercel.app`).
3. Comprueba el sitio:
   - https://pitaya-nine.vercel.app/v1/health debe responder `{"status":"ok","service":"pitaya-api"}`.
   - https://pitaya-nine.vercel.app/status debe mostrar «En línea» y, en **Coherencia**, «Los modelos se entrenaron con este snapshot».
4. Desde ahí, cada push a `main` despliega solo. El historial queda en la pestaña Actions de GitHub y en el dashboard de Vercel del proyecto `pitaya`.

## Opcional — Previews en los pull requests

Para que cada PR tenga su propia URL de prueba, crea `.github/workflows/vercel-preview.yml`:

```yaml
name: vercel-preview

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    # Los PR que vienen de forks no reciben secrets; se omiten.
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install --global vercel@latest
      - run: vercel deploy --yes --token="${{ secrets.VERCEL_TOKEN }}"
```

Las URLs de preview están protegidas por defecto (Vercel Authentication): solo las abren cuentas con acceso al proyecto en Vercel.

---

## Problemas frecuentes

| Síntoma en Actions | Causa | Solución |
|--------------------|-------|----------|
| `Error: No existing credentials found` o `The specified token is not valid` | Falta `VERCEL_TOKEN`, está mal copiado o expiró | Juan Camilo crea otro token (paso 1); Nicolás actualiza el secret |
| `Error: Project not found` o `403 forbidden` | IDs equivocados o token creado con otro *scope* | Revisa `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`; el token debe tener scope `juan-camilo-martinezs-projects` |
| El workflow no aparece en Actions | El archivo no está en `main` o Actions está deshabilitado | Sube el archivo a `main` y revisa el paso 2.3 |
| El push no dispara despliegue | Solo cambiaste archivos ignorados (`docs/`, `*.md`) | Es intencional; usa **Run workflow** si quieres desplegar igual |
| El build falla en Vercel | Error del código, no de la conexión | Abre el enlace «Inspect» del log; se reproduce en local con `make test` y `pnpm --dir frontend build` |
| `/status` muestra «Modelos de otro snapshot» | Se cambió `backend/snapshot/ads.csv` sin reentrenar | Ejecuta `make train` y sube `manifest.json` y `models/` |

## Seguridad

- El token da acceso de despliegue a la cuenta de Juan Camilo: guárdalo solo como secret de GitHub, con fecha de expiración.
- GitHub no muestra el valor de un secret después de guardarlo, ni a Nicolás. Para cambiarlo, se sobrescribe.
- Para cortar el acceso de golpe: Juan Camilo revoca el token en https://vercel.com/account/settings/tokens. El workflow fallará hasta que haya uno nuevo.
- Los PR desde forks no reciben secrets, así que nadie externo puede desplegar con este token.

## Alternativa: proyecto en la cuenta de Nicolás

Si prefieren la integración nativa (comentarios de Vercel en los PR, sin tokens), Nicolás puede importar el repo en **su** cuenta de Vercel (https://vercel.com/new → Import `PITAYA`). La GitHub App queda instalada en su cuenta y no hace falta workflow. El costo: es un proyecto nuevo, con otra URL (no `pitaya-nine.vercel.app`), y el plan Hobby no permite agregar a Juan Camilo como miembro del equipo.

## Despliegue manual (siempre disponible)

Desde la raíz del repositorio, con la sesión de Vercel de la cuenta dueña:

```bash
npx vercel login
npx vercel deploy --prod
```
