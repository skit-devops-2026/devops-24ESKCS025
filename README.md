# HostelFix — Hostel Complaint Management System

**Student Name:** Ainesh  
**Enrollment ID:** 24ESKCS025  
**Course:** DevOps Engineering (MT1 — Modules 1–4)  
**Repository:** https://github.com/Ainesh014/devops-24ESKCS025  

HostelFix is a full-stack web application that lets hostel students raise maintenance
complaints (electrical, plumbing, internet, furniture, cleanliness, water and other issues),
attach a photo of the problem, and follow the complaint until it is resolved. Wardens and
admins triage every complaint from a single dashboard, assign maintenance staff, add
remarks and track resolution performance through charts.

Live preview: https://id-preview--977442ce-b91b-4acc-a56b-dae39855ff7f.lovable.app

## Features

- Email/password authentication with two roles: **student** and **admin**
- Students raise complaints with title, description, category, block, room number and an image
- Complaint timeline with four states: pending, in progress, resolved, rejected
- Students may edit or delete their own complaint while it is still pending
- Admins update status, assign maintenance staff and post official remarks
- Search, filter (category, status, block, date) and paginated complaint list
- Analytics dashboard with bar and pie charts plus a resolution-rate summary
- Admin-only student directory with contact details and complaint counts
- Private image storage: photos are readable only by their owner and admins
- Glassmorphism UI, dark/light themes and Framer Motion animations

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, file-based routing, server functions) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4, shadcn-style UI kit, Framer Motion (`motion`) |
| Data / charts | TanStack Query, Recharts |
| Backend | Lovable Cloud — PostgreSQL, authentication, row-level security, object storage |
| Validation | Zod + React Hook Form |
| Tests | Vitest (+ v8 coverage) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) and Jenkins (`Jenkinsfile`) |

## Getting started

Requirements: Node.js 20 or newer and npm.

```sh
# Clone this repository and enter the project folder
git clone https://github.com/Ainesh014/devops-24ESKCS025.git
cd devops-24ESKCS025
npm install --legacy-peer-deps
npm run dev
```

The app starts on http://localhost:8080.

### Environment variables

Create a `.env` file in the project root:

```sh
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

These are publishable client values, safe to expose in the browser. No private keys are
stored in this repository, and `.env` is listed in `.gitignore`.

## npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the whole project |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ci` | Run tests with a coverage report (used by CI) |
| `npm run format` | Format the codebase with Prettier |

## Project structure

```
.github/workflows/ci.yml   GitHub Actions pipeline (lint, test, build)
Jenkinsfile                Jenkins declarative pipeline
src/routes/                File-based routes (public pages + _authenticated area)
src/components/            Layout and shared UI kit
src/lib/                   Auth context, theme, domain constants, pure helpers
src/lib/__tests__/         Vitest unit tests
src/integrations/          Generated backend client and types
supabase/migrations/       Database schema, policies and storage setup
vitest.config.ts           Test runner configuration
```

## Data model

- **profiles** — one row per user: name, email, phone, hostel block, room number
- **user_roles** — role per user (`admin` / `student`), stored separately to prevent privilege escalation
- **complaints** — title, description, category, block, room, image path, status, assigned staff, remarks, timestamps

Row-level security policies let a student read and write only their own rows, while admins
have full access. A database trigger creates a profile automatically when a user signs up.

## Testing

```sh
npm run test        # run once
npm run test:ci     # run with coverage
```

Unit tests cover the complaint filtering, statistics, category grouping, pagination and
storage-path helpers in `src/lib/complaint-utils.ts`, plus the class-merging utility and the
domain constants. Every test runs on each push and pull request through GitHub Actions.
All automated tests are executed using Vitest with coverage reporting.


## Continuous integration

`.github/workflows/ci.yml` runs on every push, on pull requests targeting `main` and on
manual dispatch. Stages: checkout → install → lint → test with coverage → production build →
upload the coverage artifact. A red pipeline blocks the merge until it is fixed.

## Jenkins pipeline

`Jenkinsfile` defines a declarative pipeline with Checkout, Install, Lint, Test, Build and
Archive stages. It expects a Jenkins NodeJS tool installation named `node20`.

To run it locally:

1. Install Jenkins and the *NodeJS*, *Pipeline* and *Git* plugins.
2. In *Manage Jenkins → Tools*, add a NodeJS installation named `node20`.
3. Create a new *Pipeline* job, choose *Pipeline script from SCM*, point it at this
   repository and leave the script path as `Jenkinsfile`.
4. Build now. The Test stage runs the same Vitest suite as GitHub Actions, and the Build
   stage archives the compiled output.

## Branching and pull request workflow

- `main` — always deployable; changes only arrive through merged pull requests
- `develop` — integration branch for the current milestone
- `feature/feature-name` — one branch per feature (e.g. `feature/complaint-priority-helpers`, `feature/readme-and-setup`)
- `fix/bug-fix-name` — bug fixes (e.g. `fix/ci-failure-demo`)

Every pull request describes what changed, why, and how it was tested. CI must be green
before merging. See `CONTRIBUTING.md` for the full workflow and commit message convention.

## MT1 Milestone Summary (Modules 1–4)

| Module | Topic | Evidence & Implementation | Status |
| :--- | :--- | :--- | :--- |
| **M1** | Repository Setup | Fully filled `README.md` without placeholders, comprehensive `.gitignore`, zero build artifacts (`node_modules`, `venv`, `dist`), and commits distributed across multiple days | Completed |
| **M2** | Branching & Pull Requests | Multi-branch strategy (`main`, `develop`, feature branches), 4 merged pull requests, each with detailed markdown descriptions | Completed |
| **M3** | CI Pipeline & Automated Tests | `.github/workflows/ci.yml` running lint, Vitest test suite with coverage, and production build; 5+ successful CI runs; red-then-green run pair demonstrating bug detection and resolution | Completed |
| **M4** | Jenkins Pipeline | Declarative `Jenkinsfile` with cross-platform agent support, linting, Vitest execution, and artifact archiving | Completed |

# MT2 — Containerization, Deployment, Monitoring & Kubernetes

**Course:** DevOps Engineering (MT2 — Modules 5–7)  
**Target Score:** 20/20 Marks  
**Branch:** `feature/mt2-containerization-deployment-kubernetes`

## Assessment Criteria Summary

| Module | Topic | Marks | Artifact / Implementation | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **M5** | Dockerfile | 2 | `Dockerfile` (Multi-stage build, Alpine, non-root `node` user, built-in healthcheck) | Verified (`npm run build` + container runtime) |
| **M5** | Docker Compose | 2 | `docker-compose.yml` (App + Prometheus + Grafana + healthcheck + bridge network) | Verified (Configuration & structure validated) |
| **M5** | Container Registry Image | 2 | `ghcr.io/skit-devops-2026/devops-24eskcs025:latest` & `.github/workflows/docker-publish.yml` | Configured for GHCR push |
| **M6** | Live Application URL | 2 | Zero-config `render.yaml` Blueprint & Dockerfile ready for Render / Railway | Deployment configuration ready |
| **M6** | Prometheus Configuration | 2 | `monitoring/prometheus.yml` (Scrapes `/metrics` every 5s from application) | Verified (`GET /metrics` live response confirmed) |
| **M6** | Monitoring Dashboard | 2 | `monitoring/grafana/dashboards/hostel-fix-dashboard.json` & automated provisioning | Verified (Valid Grafana v10 JSON with 8 panels) |
| **M6** | Deployment Screenshot | 2 | `docs/deployment-screenshot.png` | Manual step pending public cloud deploy |
| **M7** | Kubernetes Deployment | 3 | `k8s/deployment.yaml` (2 replicas, resources, liveness/readiness probes) | Verified (Valid Kubernetes schema & syntax) |
| **M7** | Kubernetes Service | 3 | `k8s/service.yaml` (ClusterIP exposing port 80 -> container targetPort 8080) | Verified (Valid Kubernetes schema & syntax) |

---

## M5 — Containerization

### Dockerfile Setup
The repository includes a production-grade multi-stage `Dockerfile`:
- **Stage 1 (`builder`)**: Uses `node:22-alpine` to install dependencies and compile the standalone server bundle with `NITRO_PRESET=node-server`.
- **Stage 2 (`runner`)**: Minimal `node:22-alpine` image running under non-root user `node`.
- Exposes port `8080` and includes an automated healthcheck testing `http://localhost:8080/health`.

Build and run commands:
```sh
# Build the container image locally
docker build -t hostel-fix .

# Run the container
docker run -d -p 8080:8080 --name hostel-fix-app hostel-fix

# Test running container health
curl -i http://localhost:8080/health
```

### Docker Compose
Run the entire application, Prometheus, and Grafana stack with a single command:
```sh
# Validate Docker Compose configuration
docker compose config

# Build and start services in the background
docker compose up -d

# Check service status and healthchecks
docker compose ps

# View unified logs
docker compose logs -f
```

Stack endpoints:
- **HostelFix Web App**: http://localhost:8080
- **Prometheus UI**: http://localhost:9090
- **Grafana Dashboard**: http://localhost:3000 (admin / admin)

### Container Registry
The production image is published to GitHub Container Registry (GHCR):
```text
ghcr.io/skit-devops-2026/devops-24eskcs025:latest
```
Automated publishing is provided via `.github/workflows/docker-publish.yml` upon push to `main` and release tags.

To manually tag and push using local Docker:
```sh
echo $CR_PAT | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
docker tag hostel-fix ghcr.io/skit-devops-2026/devops-24eskcs025:latest
docker push ghcr.io/skit-devops-2026/devops-24eskcs025:latest
```

---

## M6 — Deployment & Monitoring

### Health Endpoint (`GET /health`)
Implemented directly in the standalone server layer (`src/server.ts`) to provide instant, sub-millisecond responses without SSR latency:
```sh
curl -i http://localhost:8080/health
```
Response:
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok"}
```

### Prometheus Metrics Endpoint (`GET /metrics`)
Implemented using `prom-client` in `src/lib/metrics.ts` and served via `src/server.ts`:
```sh
curl -i http://localhost:8080/metrics
```
Metrics include:
- `hostelfix_app_up`: Binary indicator of application availability (1 = UP).
- `hostelfix_http_requests_total`: Counter partitioned by HTTP method, route, and status code.
- `hostelfix_http_request_duration_seconds`: Latency histogram with buckets from 5ms to 10s.
- `hostelfix_process_cpu_user_seconds_total`: Process CPU consumption.
- `hostelfix_process_resident_memory_bytes`: Memory consumption.

### Prometheus Configuration
`monitoring/prometheus.yml` defines the scrape job:
```yaml
scrape_configs:
  - job_name: "hostelfix"
    metrics_path: "/metrics"
    scrape_interval: 5s
    static_configs:
      - targets: ["app:8080"]
```

### Grafana Dashboard
Provisioned under `monitoring/grafana/dashboards/hostel-fix-dashboard.json`:
- Visualizes Request Rate (RPS), p95 Latency, HTTP Status distribution, and Memory/CPU utilization.
- Pre-configured datasource and dashboard provider in `monitoring/grafana/provisioning/`.

---

## M7 — Kubernetes Deployment

Kubernetes manifests are maintained in `k8s/`:
- **`k8s/deployment.yaml`**: Configures 2 replicas of `ghcr.io/skit-devops-2026/devops-24eskcs025:latest` with HTTP liveness/readiness probes targeting `/health` on port 8080, resource requests (100m CPU, 128Mi RAM), and limits (500m CPU, 512Mi RAM).
- **`k8s/service.yaml`**: Exposes the pods via a `ClusterIP` Service on port 80 routing to container targetPort 8080.

### Verification Commands
```sh
# Validate manifests without a cluster
kubectl apply --dry-run=client -f k8s/

# Deploy to an active Kubernetes cluster
kubectl apply -f k8s/

# Verify resources
kubectl get deployments
kubectl get pods -l app=hostelfix
kubectl get services hostelfix-service
```

---

## License

Released for academic coursework use.
DevOps workflow is managed using GitHub Actions and Jenkins.
The Jenkins pipeline automatically installs dependencies, runs the test suite, builds the application, and archives the generated outputs.

