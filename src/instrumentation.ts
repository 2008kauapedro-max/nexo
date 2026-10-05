import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;
  console.error("nexo_request_error", {
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    digest,
    route: context.routePath,
    method: request.method,
    kind: context.routeType,
  });
};
