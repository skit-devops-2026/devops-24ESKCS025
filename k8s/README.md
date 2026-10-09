# HostelFix Kubernetes Deployment

This directory contains production Kubernetes manifests for running the HostelFix containerized application.

## Manifests

- **`deployment.yaml`**: Deploys 2 replicas of `ghcr.io/skit-devops-2026/devops-24eskcs025:latest`, with `/health` liveness & readiness probes, CPU/Memory resource constraints, and secure environment configuration.
- **`service.yaml`**: Exposes the application internally on port 80 routing to container targetPort 8080.

## Validation

Validate manifests without a live cluster:
```sh
kubectl apply --dry-run=client -f k8s/
```

## Deployment Instructions

### 1. (Optional) Create Secret for Supabase Credentials
```sh
kubectl create secret generic hostelfix-secrets \
  --from-literal=supabase-url='https://your-project.supabase.co' \
  --from-literal=supabase-key='your_publishable_key'
```

### 2. Apply Manifests
```sh
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 3. Verify Rollout & Pod Health
```sh
kubectl get deployments
kubectl get pods -l app=hostelfix
kubectl get services hostelfix-service
```

### 4. Port-Forward for Local Testing
```sh
kubectl port-forward service/hostelfix-service 8080:80
curl http://localhost:8080/health
```
