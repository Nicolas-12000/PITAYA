/** Proxy same-origin hacia FastAPI con lista de rutas permitidas (FRONTEND.md §0.4 y §16). */
const BASE = process.env.BACKEND_URL ?? "http://localhost:8000";

const ALLOWED: Record<string, string[]> = {
  "v1/health": ["GET"],
  "v1/status": ["GET"],
  "v1/kpis": ["GET"],
  "v1/roi": ["GET"],
  "v1/models": ["GET"],
  "v1/segments": ["GET"],
  "v1/channels/compare": ["GET"],
  "v1/attribution": ["GET"],
  "v1/recommendations": ["GET", "POST"],
  "v1/predict": ["POST"],
  "v1/ab-test": ["POST"],
  "v1/admin/sync": ["POST"],
};

async function forward(request: Request, ctx: RouteContext<"/api/backend/[...path]">) {
  const path = (await ctx.params).path.join("/");
  if (!ALLOWED[path]?.includes(request.method)) {
    return Response.json({ detail: "Ruta no permitida por el proxy" }, { status: 404 });
  }
  const key = request.headers.get("idempotency-key");
  try {
    const upstream = await fetch(`${BASE}/${path}${new URL(request.url).search}`, {
      method: request.method,
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/json",
        ...(key ? { "idempotency-key": key } : {}),
      },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ detail: "Backend no disponible" }, { status: 502 });
  }
}

export { forward as GET, forward as POST };
