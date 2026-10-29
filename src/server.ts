import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  getMetrics,
  getMetricsContentType,
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from "./lib/metrics";

import {
  registerUser,
  loginUser,
  getUserByToken,
  logoutUser,
  executeQuery,
  saveUploadedFile,
  getUploadedFile,
} from "./lib/server-db";

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

async function handleLocalApiRequest(request: Request, pathname: string): Promise<Response> {
  const jsonHeaders = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache, no-store, must-revalidate",
  };

  try {
    if (pathname === "/api/local/auth/signup" && request.method === "POST") {
      const body = await request.json();
      const result = registerUser({
        email: body.email,
        password: body.password,
        name: body.options?.data?.name,
        room_number: body.options?.data?.room_number,
        hostel_block: body.options?.data?.hostel_block,
        phone: body.options?.data?.phone,
      });
      return new Response(JSON.stringify({ data: result, error: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (pathname === "/api/local/auth/signin" && request.method === "POST") {
      const body = await request.json();
      const result = loginUser(body.email, body.password);
      return new Response(JSON.stringify({ data: result, error: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (pathname === "/api/local/auth/signout" && request.method === "POST") {
      const authHeader = request.headers.get("authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token) logoutUser(token);
      return new Response(JSON.stringify({ error: null }), { status: 200, headers: jsonHeaders });
    }

    if (pathname === "/api/local/auth/session" && request.method === "GET") {
      const authHeader = request.headers.get("authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const result = token ? getUserByToken(token) : null;
      return new Response(
        JSON.stringify({
          data: { session: result?.session ?? null, user: result?.user ?? null },
          error: null,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    if (pathname === "/api/local/query" && request.method === "POST") {
      const body = await request.json();
      const result = executeQuery(body);
      return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
    }

    if (pathname === "/api/local/storage/upload" && request.method === "POST") {
      const body = await request.json();
      const result = saveUploadedFile(body.path, body.base64);
      return new Response(JSON.stringify({ data: result, error: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (pathname.startsWith("/api/local/storage/file/")) {
      const pathName = decodeURIComponent(pathname.replace("/api/local/storage/file/", ""));
      const fileData = getUploadedFile(pathName);
      if (!fileData) {
        return new Response(JSON.stringify({ error: { message: "File not found" } }), {
          status: 404,
          headers: jsonHeaders,
        });
      }
      return new Response(JSON.stringify({ data: { signedUrl: fileData }, error: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ error: { message: "Endpoint not found" } }), {
      status: 404,
      headers: jsonHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ data: null, error: { message: err?.message || "Internal server error" } }),
      {
        status: 400,
        headers: jsonHeaders,
      },
    );
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const startTime = performance.now();
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Handle /api/local endpoints directly for self-contained persistent database
    if (pathname.startsWith("/api/local/")) {
      return handleLocalApiRequest(request, pathname);
    }

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
