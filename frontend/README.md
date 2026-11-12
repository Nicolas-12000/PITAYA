# Frontend (solo guía — sin implementación)

Esta carpeta documenta la UI futura descrita en [PITAYA.MD](../PITAYA.MD). **No hay código Next.js activo**; el desarrollo actual es solo backend.

Cuando el equipo retome el frontend:

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --use-pnpm
cp .env.example .env.local   # API_BASE_URL=http://localhost:8000
```

Ver [ROUTES.md](./ROUTES.md) para el mapa página → endpoint.
