# PITAYA frontend — guía

## Cómo se creó (comando oficial)

```bash
pnpm create next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --turbopack \
  --yes
```

## Alcance

- Base Next.js **sin** dashboard ni llamadas a la API todavía.
- Ver [ROUTES.md](./ROUTES.md) para implementación futura.
- Desarrollo activo del equipo: **backend**.

## Variables

`API_BASE_URL` en `.env.local` (ver `.env.example`).
