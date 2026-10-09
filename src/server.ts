import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  getMetrics,
  getMetricsContentType,
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from "./lib/metrics";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function normalizeRoute(pathname: string): string {
  if (
    pathname === "/" ||
    pathname === "/health" ||
    pathname === "/metrics" ||
    pathname === "/auth"
  ) {
    return pathname;
  }
  if (pathname.startsWith("/complaints")) {
    return "/complaints";
  }
  if (pathname.startsWith("/admin")) {
    return "/admin";
  }
  if (pathname.startsWith("/assets")) {
    return "/assets/*";
  }
  return pathname;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const startTime = performance.now();
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Handle /health endpoint directly
    if (pathname === "/health" || pathname === "/health/") {
      const response = new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-cache, no-store, must-revalidate",
        },
      });
      const durationSeconds = (performance.now() - startTime) / 1000;
      httpRequestsTotal.inc({ method, route: "/health", status_code: "200" });
      httpRequestDurationSeconds.observe(
        { method, route: "/health", status_code: "200" },
        durationSeconds,
      );
      return response;
    }

    // Handle /metrics endpoint directly for Prometheus scraping
    if (pathname === "/metrics" || pathname === "/metrics/") {
      try {
        const metrics = await getMetrics();
        const response = new Response(metrics, {
          status: 200,
          headers: {
            "content-type": getMetricsContentType(),
            "cache-control": "no-cache, no-store, must-revalidate",
          },
        });
        const durationSeconds = (performance.now() - startTime) / 1000;
        httpRequestsTotal.inc({ method, route: "/metrics", status_code: "200" });
        httpRequestDurationSeconds.observe(
          { method, route: "/metrics", status_code: "200" },
          durationSeconds,
        );
        return response;
      } catch (metricsError) {
        console.error("Error generating metrics:", metricsError);
        return new Response("Internal Server Error generating metrics", {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    }

    // Pass application traffic through TanStack Start server handler
    const route = normalizeRoute(pathname);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      const statusCode = String(normalized.status);
      const durationSeconds = (performance.now() - startTime) / 1000;
      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      httpRequestDurationSeconds.observe(
        { method, route, status_code: statusCode },
        durationSeconds,
      );
      return normalized;
    } catch (error) {
      console.error(error);
      const durationSeconds = (performance.now() - startTime) / 1000;
      httpRequestsTotal.inc({ method, route, status_code: "500" });
      httpRequestDurationSeconds.observe({ method, route, status_code: "500" }, durationSeconds);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
