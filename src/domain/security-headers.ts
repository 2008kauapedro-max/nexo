export function contentSecurityPolicy(
  nonce: string,
  options: { development: boolean; captcha: boolean },
) {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(nonce)) throw new Error("INVALID_NONCE");
  const { development, captcha } = options;
  return (
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
      // Existing React progress bars and computed layouts use style attributes, never user HTML.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' https://jseljonjvpkurvhwqsjh.supabase.co${captcha ? " https://challenges.cloudflare.com" : ""}${development ? " ws: http://localhost:*" : ""}`,
      `frame-src ${captcha ? "https://challenges.cloudflare.com" : "'none'"}`,
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "worker-src 'self'",
    ].join("; ") + ";"
  );
}
