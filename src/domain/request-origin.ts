/** Browser Origin must match the HTTP host. Ignore caller-supplied forwarded hosts. */
export function isSameOriginRequest(request: Request): boolean {
  try {
    const raw = request.headers.get("origin");
    if (!raw) return false;
    const origin = new URL(raw);
    if (raw !== origin.origin || origin.username || origin.password)
      return false;
    const host = request.headers.get("host") || new URL(request.url).host;
    if (origin.host !== host) return false;
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
      origin.hostname,
    );
    return (
      origin.protocol === "https:" || (loopback && origin.protocol === "http:")
    );
  } catch {
    return false;
  }
}
