import "server-only";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, { status: 200, ...init });
}
export function created<T>(data: T) {
  return Response.json(data, { status: 201 });
}
export function bad(msg = "Bad Request") {
  return Response.json({ error: msg }, { status: 400 });
}
export function notFound(msg = "Not Found") {
  return Response.json({ error: msg }, { status: 404 });
}
export function conflict(msg = "Conflict") {
  return Response.json({ error: msg }, { status: 409 });
}
export function serverError(e: unknown) {
  console.error(e);
  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}
