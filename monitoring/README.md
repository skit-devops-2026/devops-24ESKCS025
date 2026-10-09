# HostelFix Monitoring & Observability

This directory contains the Prometheus and Grafana observability stack configuration for HostelFix.

## Architecture

- **Prometheus**: Scrapes `/metrics` from the HostelFix application at 5s intervals.
- **Grafana**: Visualizes real-time metrics through a pre-provisioned dashboard connected to Prometheus.
- **Application Instrumentation**: Uses `prom-client` in `src/lib/metrics.ts` exposed via `GET /metrics` in `src/server.ts`.

## Directory Structure

```text
monitoring/
├── prometheus.yml                        # Prometheus server scrape configuration
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml   # Auto-provisioned Prometheus datasource
│   │   └── dashboards/dashboards.yml    # Auto-provisioned dashboard provider
│   └── dashboards/
│       └── hostel-fix-dashboard.json    # HostelFix Observability Dashboard definition
└── README.md                             # Documentation and verification guide
```

## Metrics Exposed by HostelFix

| Metric Name | Type | Description |
| :--- | :--- | :--- |
| `hostelfix_app_up` | Gauge | Application availability status (1 = UP, 0 = DOWN) |
| `hostelfix_app_info` | Gauge | Application metadata (version, framework, environment) |
| `hostelfix_http_requests_total` | Counter | Total HTTP requests labeled by `method`, `route`, and `status_code` |
| `hostelfix_http_request_duration_seconds` | Histogram | Latency histogram (seconds) labeled by `method`, `route`, and `status_code` |
| `hostelfix_process_cpu_user_seconds_total` | Counter | Total user CPU time consumed |
| `hostelfix_process_cpu_system_seconds_total` | Counter | Total system CPU time consumed |
| `hostelfix_process_resident_memory_bytes` | Gauge | Resident set memory (RSS) in bytes |
| `hostelfix_nodejs_eventloop_lag_seconds` | Gauge | NodeJS event loop lag |

## Dashboard Panels

The Grafana dashboard (`uid: hostelfix-overview`) includes 8 panels:

1. **Application Availability** (Stat panel): Shows real-time UP/DOWN status.
2. **Total Request Rate (rps)** (Stat / Sparkline): Aggregated requests per second.
3. **95th Percentile Latency** (Stat / Sparkline): p95 request duration in seconds.
4. **Process Memory Usage** (Stat / Sparkline): Memory consumption in bytes.
5. **Request Rate by Route** (Time series): Per-route throughput breakdown.
6. **HTTP Status Code Distribution** (Stacked bar): Distribution of 2xx, 3xx, 4xx, 5xx responses.
7. **Request Latency Distribution** (Time series): Multi-line graph for p50, p90, and p99 latencies.
8. **CPU Time Rate** (Time series): Rate of user and system CPU consumption.

## Verification

### 1. Verify Application Metrics Endpoint
```sh
curl -i http://localhost:8080/metrics
```

### 2. Verify Prometheus Scrape Status
Access the Prometheus UI at http://localhost:9090 and navigate to **Status -> Targets**. The `hostelfix` job should display state `UP`.

Query Prometheus via API:
```sh
curl -s http://localhost:9090/api/v1/query?query=hostelfix_app_up
```

### 3. Access Grafana Dashboard
Access Grafana at http://localhost:3000 (default credentials: `admin` / `admin`).
Open the **HostelFix Observability Dashboard** to inspect live metrics.
