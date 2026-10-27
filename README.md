# API Sentinel

API Sentinel is a backend-focused API monitoring platform. It periodically checks HTTP endpoints, stores response history, opens incidents after consecutive failures, and sends recovery/outage notifications through SMTP.

The repository includes a public simulation mode so the product can be explored without credentials or external requests. The production-style API and worker are also implemented and can be run locally with PostgreSQL.

## What this project demonstrates

- TypeScript backend development with Express.
- JWT authentication and password hashing with Node's `crypto` module.
- PostgreSQL data modelling, indexes, constraints and parameterized SQL through `pg`.
- Modular separation between HTTP requests and background work.
- A polling worker with request timeouts and failure handling.
- Incident lifecycle management and duplicate-alert prevention.
- SMTP email delivery through Nodemailer.
- React/Vite dashboard design for operational data.
- Docker Compose, OpenAPI documentation and automated checks.

## Architecture

```text
React/Vite dashboard
          |
          v
Express REST API ------ PostgreSQL
          ^                  ^
          |                  |
          +----------- Worker
                         |
                    HTTP checks
                         |
                      Nodemailer
```

`apps/api` handles authentication, monitor management, check history and incidents. `apps/worker` polls due monitors every minute, executes checks, persists results and sends email only when an incident opens or recovers. The worker is deliberately separate from the HTTP process so slow or unavailable target APIs do not block the dashboard.

## Public demo

The frontend includes a clearly labelled simulation mode. It uses local state and does not pretend that its sample monitors are real services. Visitors can simulate an outage and recover it to understand the incident workflow without creating an account.

## Run the real stack locally

Requirements: Node.js 22+, Docker Desktop and an SMTP account for email alerts.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
```

Set at least these values in `.env`:

```env
DATABASE_URL=postgresql://sentinel:sentinel@localhost:5432/api_sentinel
JWT_SECRET=replace-with-a-long-random-secret
WEB_ORIGIN=http://localhost:5173
```

For email notifications configure:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=API Sentinel <alerts@example.com>
```

Apply the schema and start each process:

```bash
npm run migrate --workspace apps/api
npm run dev:api
npm run dev:worker
npm run dev:web
```

The API is available at `http://localhost:3001/health` and the public dashboard at the Vite URL. The real API requires registration through `POST /api/auth/register`, then a Bearer token for monitor endpoints.

## API

The initial contract is documented in [`openapi.yaml`](./openapi.yaml). Implemented routes include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/monitors`
- `POST /api/monitors`
- `DELETE /api/monitors/:id`
- `GET /api/monitors/:id/checks`
- `GET /api/incidents`

## Docker

The local PostgreSQL service is included in `docker-compose.yml`. The API and worker also have Docker targets:

```bash
docker build --target api -t api-sentinel-api .
docker build --target worker -t api-sentinel-worker .
```

For a complete production deployment, provide a managed PostgreSQL `DATABASE_URL`, a strong `JWT_SECRET`, and private SMTP variables. Never commit `.env` or SMTP credentials.

## Verification

```bash
npm run build --workspace apps/api
npm run build --workspace apps/worker
npm run build --workspace apps/web
npm test
```

## Project status

The public simulation is intended for portfolio visitors. The real stack is intentionally configured for local/self-hosted deployment, where its PostgreSQL and SMTP credentials can be controlled safely. This keeps the portfolio demo reliable while still exposing a complete backend architecture and reproducible setup.
