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

### Why local state instead of a remote backend

Terraform's official recommendation is to store state remotely (e.g. in an S3 bucket, Cloudflare R2, or Terraform Cloud) rather than on a local machine. This project intentionally uses **local state** instead, and it's worth explaining why — both the constraint and the reasoning.

**The constraint:**
This project was built entirely on free-tier infrastructure with a strict no-cost, no-credit-card requirement. Cloudflare Workers, D1, and the Cloudflare API all support this without needing payment details. Cloudflare R2 (the natural remote-state option within the same ecosystem) is the one exception — enabling it requires a payment method on file, even though usage itself would stay within the free monthly quota. Given the constraint, remote state was deliberately left out rather than compromised on.

**Why remote state matters (and would be the next step):**
- **State locking** — prevents two people (or two CI runs) from applying changes at the same time and corrupting the state file
- **Shared access** — lets a team run `terraform apply` from any machine, not just the one that happens to hold the state file
- **Durability** — state isn't lost if a single laptop is wiped, lost, or unavailable
- **CI/CD integration** — a fully automated pipeline (including infrastructure changes, not just code deploys) requires state to be accessible from GitHub Actions' ephemeral runners, which don't persist anything between runs

**What this project does instead:**
Given local state, this project splits deployment into two intentional lanes:
- **Infrastructure changes** (`terraform apply`) are run manually, from the machine holding the state file — infrequent, deliberate, and reviewed by hand
- **Application code deployments** (`wrangler deploy`) are fully automated via CI/CD on every merge to `main` — frequent, low-risk, and safe to automate without shared state

**In a funded/production setting**, the immediate next step would be migrating to a remote backend (Cloudflare R2 or an S3-compatible bucket), which would unlock fully automated infrastructure changes as part of the CD pipeline — not just code deploys.

## CI/CD Pipeline

**CI** (`.github/workflows/ci.yml`) — runs on every pull request:
- Type-checks the TypeScript source
- Runs the test suite
- Validates Terraform formatting and configuration

**CD** (`.github/workflows/cd.yml`) — runs on every push to `main`:
- Automatically deploys the Worker to Cloudflare via `wrangler deploy`

## Live Deployment

`https://task-tracker-cloud.a-faiz0719.workers.dev`