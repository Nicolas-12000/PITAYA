# PITAYA frontend

Scaffold oficial de Next.js (`pnpm create next-app@latest`). **Pendiente:** construir el dashboard y las pantallas (el backend ya expone `/v1`). Guía unificada abajo.

## Documentación

- **[FRONTEND.md](./FRONTEND.md)** — sistema de diseño, stack, pantallas, integración API y plan de trabajo (incluye contrato con el backend implementado en la sección 0).
- **[AGENTS.md](./AGENTS.md)** — reglas para agentes (Next.js + reglas PITAYA UI).
- **Backend:** [PITAYA.MD](../PITAYA.MD), OpenAPI en `http://localhost:8000/docs`.

## Inicio

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:8000
pnpm install
pnpm dev
```

Variables: ver `.env.example`. API en marcha con `make backend-dev` en la raíz del repo.
