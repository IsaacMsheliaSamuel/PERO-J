# Kubernetes Deployment Guide

This guide details how to deploy PERO-J (Soroban Smart Block Explorer) indexer and frontend services onto a Kubernetes cluster.

## Manifest Structure

All Kubernetes resources are located in the `k8s/` directory:

- `k8s/configmap.yaml`: ConfigMap (`pero-config`) holding non-sensitive configuration values.
- `k8s/secret.yaml`: Secret template (`pero-secrets`) holding database connection strings.
- `k8s/indexer-deployment.yaml`: Deployment and Service manifests for the backend indexer.
- `k8s/frontend-deployment.yaml`: Deployment and Service manifests for the frontend UI.
- `k8s/hpa.yaml`: HorizontalPodAutoscaler for frontend autoscaling based on CPU utilization.

## Environment Configuration

### ConfigMap (`k8s/configmap.yaml`)

| Variable | Description | Default |
|---|---|---|
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `HORIZON_URL` | Horizon REST endpoint | `https://horizon-testnet.stellar.org` |
| `NETWORK_PASSPHRASE` | Stellar network passphrase | `Test SDF Network ; September 2015` |
| `START_LEDGER` | Starting ledger sequence (0 to auto-resume) | `0` |
| `POLL_MS` | Ingestion poll interval in ms | `5000` |
| `PORT` | API server listen port | `3001` |
| `LAG_ALERT_THRESHOLD_S` | Maximum allowed indexing lag before readiness degrades | `30` |
| `DATABASE_POOL_SIZE` | Maximum PostgreSQL connections in the indexer pool (1-100) | `20` |
| `VITE_API_PROXY` | Proxy target for frontend API requests | `http://indexer:3001` |

### Secrets (`k8s/secret.yaml`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL (`postgres://user:password@host:port/dbname`) |

## Health and Readiness Probes

The indexer container exposes two health endpoints:
- **Liveness Probe (`/ready`)**: Verifies basic database connectivity and process liveness.
- **Readiness Probe (`/health`)**: Validates database connectivity as well as indexer lag against `LAG_ALERT_THRESHOLD_S` (returning HTTP 503 if degraded).

## Deploying to Kubernetes

1. **Configure Secrets & ConfigMap**:
   Update `k8s/configmap.yaml` and `k8s/secret.yaml` with your target network and database credentials.

2. **Apply Manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verify Deployment**:
   ```bash
   kubectl get pods -l 'app in (indexer,frontend)'
   kubectl get svc
   ```

4. **View Logs**:
   ```bash
   kubectl logs -f deployment/indexer
   kubectl logs -f deployment/frontend
   ```


## Staging Environment (automated CD)

The staging environment runs the latest `main` branch code on Stellar **testnet**
and is deployed automatically on every merge to `main` by the
[`deploy-staging.yml`](../.github/workflows/deploy-staging.yml) workflow.

### Pipeline

1. **Build & push** — the indexer (`indexer/Dockerfile`) and frontend
   (`frontend/Dockerfile.prod`, an nginx-served production build) images are
   built and pushed to the GitHub Container Registry as
   `ghcr.io/<owner>/pero-j-indexer:<sha>` and `ghcr.io/<owner>/pero-j-frontend:<sha>`
   (plus a moving `:staging` tag).
2. **Deploy** — the workflow applies the staging manifests into the
   `pero-j-staging` namespace and rolls the deployments to the new image tags.
3. **Smoke test** — `scripts/smoke-test.sh` exercises the staging endpoints
   (`/`, `/api/contracts`, `/api/events`, `/api/functions`) and validates the
   JSON shapes through the frontend nginx proxy → indexer → PostgreSQL path.

### Staging manifests

The staging-specific resources live in [`k8s/staging/`](../k8s/staging/):

| File | Purpose |
|------|---------|
| `namespace.yaml` | The `pero-j-staging` namespace. |
| `configmap.yaml` | `pero-config` pointing the indexer at testnet (`SOROBAN_RPC_URL`, `HORIZON_URL`, `NETWORK_PASSPHRASE`, …). |
| `secret.yaml` | `pero-secrets` **template** with placeholders — the workflow creates the real Secret from repository secrets, so credentials are never committed. |

The base `k8s/indexer-deployment.yaml`, `k8s/frontend-deployment.yaml`, and
`k8s/hpa.yaml` are applied into the `pero-j-staging` namespace and have their
images overridden to the freshly built GHCR tags by the workflow.

### Required repository secrets

Configure these under **Settings → Secrets → Actions** to enable automated
staging deployment:

| Secret | Required | Description |
|--------|----------|-------------|
| `KUBECONFIG_STAGING` | yes | base64-encoded kubeconfig for the staging cluster |
| `STAGING_DATABASE_URL` | yes | PostgreSQL connection string for the staging DB |
| `STAGING_API_ADMIN_KEY` | no | admin key for protected API routes (empty disables them) |
| `STAGING_EXPLORER_ADMIN_SECRET` | no | secret key for on-chain event submission (empty skips submission) |

Until both required secrets are set, the deploy job no-ops (the images still
build and push on every push to `main`), so the workflow is safe to merge
before a staging cluster exists.

### Optional: deploy the contract to testnet

To also deploy/refresh the ExplorerContract to testnet on each run, set the
repository variable `DEPLOY_STAGING_CONTRACT=true` and the `STELLAR_SECRET_KEY`
secret. This is off by default — most staging setups reuse a stable testnet
contract id configured in the staging ConfigMap.

### Frontend production image

`frontend/Dockerfile.prod` builds the Vite bundle and serves it with nginx on
port 3000 (matching the `frontend` Service). nginx proxies `/api/*` to the
in-cluster `pero-indexer:3001` service, so no CORS configuration is needed.
`frontend/nginx.conf` also disables buffering for the live event stream
(`/api/events/stream`).
