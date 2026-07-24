# Task Tracker Cloud

A serverless task-tracking API built on Cloudflare Workers, with infrastructure provisioned as code via Terraform and automated CI/CD via GitHub Actions.

This project was built to gain hands-on experience with Infrastructure as Code, CI/CD pipelines, and cloud-native serverless architecture — skills targeted at cloud/DevOps engineering roles.

## Architecture

```
┌─────────────┐      ┌──────────────────┐       ┌─────────────────┐
│   Client    │────▶| Cloudflare Worker │────▶ │  D1 Database    │
│ (HTTP/REST) │      │  (TypeScript API)│       │  (SQLite-based) │
└─────────────┘      └──────────────────┘       └─────────────────┘
```
- **Compute**: Cloudflare Workers (serverless, edge-deployed, TypeScript)
- **Database**: Cloudflare D1 (SQLite-compatible, serverless SQL)
- **Infrastructure as Code**: Terraform (Cloudflare provider) — provisions both the Worker and the D1 database
- **CI**: GitHub Actions — lints, type-checks, and tests on every pull request; validates Terraform config
- **CD**: GitHub Actions — automatically deploys the Worker to Cloudflare on every merge to `main`

## API Endpoints

| Method | Path         | Description                   |
|--------|--------------|-------------------------------|
| GET    | `/tasks`     | List all tasks                |
| POST   | `/tasks`     | Create a new task             |
| PATCH  | `/tasks/:id` | Update a task's status/fields |
| DELETE | `/tasks/:id` | Delete a task                 |

**Example — create a task:**
```bash
curl -X POST https://task-tracker-cloud.a-faiz0719.workers.dev/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Terraform", "description": "Finish the D1 project"}'
```

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1
- **IaC**: Terraform (`cloudflare/cloudflare` provider ~> 4.0)
- **CI/CD**: GitHub Actions
- **Testing**: Vitest with `@cloudflare/vitest-pool-workers`

## Local Development

```bash
npm install
npm run dev          # starts local dev server at http://127.0.0.1:8787
npm test             # runs the test suite
```

## Infrastructure

Infrastructure is defined in `infra/` and provisions:
- A D1 database (`task-tracker-db`)
- A Workers script bound to that database

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### A note on Terraform state

This project intentionally uses **local Terraform state** rather than a remote backend (e.g. R2, S3, Terraform Cloud). Given the project's zero-cost constraint, Cloudflare R2 requires a payment method on file to enable — even though usage itself stays within the free tier — so it was excluded here as a deliberate tradeoff rather than a technical limitation.

In a team setting, this project would use a remote backend (R2 or an S3-compatible bucket) for shared state access and locking. As a result, **infrastructure changes (`terraform apply`) are run manually**, while **application code deployments are fully automated** via CD — a common split even in teams that do have remote state, since code ships far more often than infrastructure changes.

## CI/CD Pipeline

**CI** (`.github/workflows/ci.yml`) — runs on every pull request:
- Type-checks the TypeScript source
- Runs the test suite
- Validates Terraform formatting and configuration

**CD** (`.github/workflows/cd.yml`) — runs on every push to `main`:
- Automatically deploys the Worker to Cloudflare via `wrangler deploy`

## Live Deployment

`https://task-tracker-cloud.a-faiz0719.workers.dev`