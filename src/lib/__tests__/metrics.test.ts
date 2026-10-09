import { describe, expect, it } from "vitest";
import {
  appUpGauge,
  getMetrics,
  getMetricsContentType,
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from "../metrics";

describe("Prometheus Metrics & Health Instrumentation", () => {
  it("provides Prometheus text content type", () => {
    const contentType = getMetricsContentType();
    expect(contentType).toContain("text/plain");
  });

  it("exports application availability gauge set to 1", async () => {
    const metrics = await getMetrics();
    expect(metrics).toContain("hostelfix_app_up 1");
  });

  it("records http request metrics correctly", async () => {
    httpRequestsTotal.inc({ method: "GET", route: "/health", status_code: "200" });
    httpRequestDurationSeconds.observe(
      { method: "GET", route: "/health", status_code: "200" },
      0.012,
    );

    const metrics = await getMetrics();
    expect(metrics).toContain("hostelfix_http_requests_total");
    expect(metrics).toContain('route="/health"');
    expect(metrics).toContain("hostelfix_http_request_duration_seconds");
  });
});
