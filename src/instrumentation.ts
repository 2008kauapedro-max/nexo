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
    digest,
    route: context.routePath,
    method: request.method,
    kind: context.routeType,
  });
};
