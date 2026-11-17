/** Base del API. En local usa BACKEND_URL; en Vercel, el mismo despliegue. */
export function backendOrigin(): string {
  const configured = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:8000";
}
