import client from "prom-client";

// Singleton registry for Prometheus metrics
export const register = new client.Registry();

// Add default process & NodeJS metrics (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({
  register,
  prefix: "hostelfix_",
});

// Application availability gauge
export const appUpGauge = new client.Gauge({
  name: "hostelfix_app_up",
  help: "HostelFix application availability (1 if up, 0 if down)",
  registers: [register],
});
appUpGauge.set(1);

// Application info gauge
export const appInfoGauge = new client.Gauge({
  name: "hostelfix_app_info",
  help: "HostelFix application information",
  labelNames: ["version", "framework", "environment"],
  registers: [register],
});
appInfoGauge.set(
  {
    version: "1.0.0",
    framework: "tanstack-start",
    environment: process.env.NODE_ENV || "production",
  },
  1,
);

// HTTP requests counter
export const httpRequestsTotal = new client.Counter({
  name: "hostelfix_http_requests_total",
  help: "Total count of HTTP requests processed by HostelFix",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: "hostelfix_http_request_duration_seconds",
  help: "HTTP request latency in seconds for HostelFix",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getMetricsContentType(): string {
  return register.contentType;
}
