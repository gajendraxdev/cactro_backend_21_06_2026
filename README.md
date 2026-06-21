# Event Booking System

A production-oriented Event Booking System backend built as a TypeScript monorepo. It provides a Fastify REST API for authentication, event management, and ticket booking, plus a BullMQ worker for background notifications.

## Architecture Overview

```text
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  event-manager  │────▶│    Redis     │◀────│     worker      │
│   (Fastify API) │     │   (BullMQ)   │     │ (job processor) │
└────────┬────────┘     └──────────────┘     └────────┬────────┘
         │                                             │
         └──────────────────┬──────────────────────────┘
                              ▼
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │   (Prisma)   │
                        └──────────────┘
```

- **event-manager** — HTTP API, auth, validation, queue publishing
- **worker** — consumes BullMQ jobs, simulates email/notification via `console.log`
- **packages/db** — Prisma schema and singleton client
- **packages/queue** — shared Redis connection and queue helpers
- **packages/types** — shared enums and job payload types
- **packages/config** — Zod-validated environment configuration

## Folder Structure

```text
apps/
  event-manager/          # Main API service
    src/
      modules/
        auth/
        events/
        bookings/
      plugins/
      middleware/
      utils/
      app.ts
      server.ts
  worker/                 # Background job processor
    src/
      jobs/
        booking-confirmation.job.ts
        event-update-notification.job.ts
      worker.ts

packages/
  config/                 # Environment config (Zod)
  db/                     # Prisma schema + client
  queue/                  # BullMQ queues + Redis
  types/                  # Shared TypeScript types

pnpm-workspace.yaml
```

## Design Decisions

### Resolved Ambiguities

These items were not fully specified in the requirements. The following defaults were adopted:

| Topic | Decision |
|-------|----------|
| **JWT payload** | `{ userId, email, role }` — `userId` maps to the database `User.id` |
| **Pagination** | Query params `?page=1&limit=10` (default limit 10, max 100). Response shape: `{ success, data, meta: { page, limit, total, totalPages } }` |
| **Date filtering** | `GET /events?from=<ISO>&to=<ISO>` filters on `eventDate` (inclusive range) |
| **Organizer ownership** | `PATCH` and `DELETE /events/:id` verify `event.organizerId === authenticated user.userId`; returns 403 if not the owner |
| **Registration role** | Client sends `role` in the register body (`ORGANIZER` or `CUSTOMER`); validated with Zod |

### Other Decisions

- **Overbooking prevention** — Prisma transaction with optimistic `updateMany` guard (`availableTickets >= quantity`) inside the transaction
- **Event update notifications** — published after successful PATCH; worker deduplicates customers via `distinct: ["customerId"]`
- **Ticket recount on update** — if `totalTickets` changes, `availableTickets` is recalculated as `newTotal - alreadyBooked`
- **Queue retries** — 3 attempts with exponential backoff (1s base delay)
- **Worker concurrency** — 5 concurrent jobs per queue
- **Error format** — `{ success: false, message, errors: [] }` via centralized `AppError` handler
- **ESM + strict TypeScript** — all packages use `"type": "module"` and `NodeNext` resolution
- **Prisma ORM 7.x** — uses `prisma-client` generator, `prisma.config.ts`, and `@prisma/adapter-pg` driver adapter

## Assumptions

- No real email or push notification service; jobs log to stdout
- JWT access tokens do not expire by default (Fastify JWT default); suitable for demo/dev
- One booking per request; no cart or multi-event checkout
- Event deletion cascades to bookings (Prisma `onDelete: Cascade`)
- Browse events (`GET /events`, `GET /events/:id`) is public — no auth required
- `users/` module is not a separate route group; user lifecycle is handled via `/auth`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:your_password@localhost:5432/event_manager` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6380` |
| `JWT_SECRET` | Secret for signing JWTs (min 16 chars) | `your-long-random-secret` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |

Copy `.env.example` to `.env` and adjust values.

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL running locally (port `5432`, database `event_manager`)
- Redis running locally (port `6380`)

### Quick Start

```bash
# 1. Install dependencies (use pnpm only — do not mix with npm)
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env if your Postgres/Redis URLs differ

# 3. One-time database setup (runs migrations)
pnpm run setup

# 4. Start API + worker together
pnpm run dev
```

API: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/docs`  
Health check: `http://localhost:3000/health`

`npm run dev` starts both the API and worker in one terminal. To run them separately:

```bash
pnpm run dev:api
pnpm run dev:worker
```

## API Examples

### Register an organizer

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Organizer",
    "email": "alice@example.com",
    "password": "password123",
    "role": "ORGANIZER"
  }'
```

### Register a customer

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Customer",
    "email": "bob@example.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### Create an event (organizer)

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "title": "Tech Conference 2026",
    "description": "Annual developer conference",
    "location": "San Francisco, CA",
    "eventDate": "2026-09-15T09:00:00.000Z",
    "totalTickets": 100
  }'
```

### List events (public, with pagination & date filter)

```bash
curl "http://localhost:3000/events?page=1&limit=10&sortBy=eventDate&sortOrder=asc&from=2026-01-01&to=2026-12-31"
```

### Book tickets (customer)

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "eventId": "<EVENT_ID>",
    "quantity": 2
  }'
```

### View my bookings (customer)

```bash
curl http://localhost:3000/bookings/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Queue Design

| Queue | Producer | Payload | Worker Action |
|-------|----------|---------|---------------|
| `booking-confirmation` | `POST /bookings` | `{ bookingId, customerId }` | Logs simulated confirmation email |
| `event-update-notification` | `PATCH /events/:id` | `{ eventId }` | Fetches booked customers, logs update per email |

- Shared Redis connection via `packages/queue`
- 3 retry attempts with exponential backoff
- Worker concurrency: 5 per queue
- Jobs are removed on complete; failed jobs retained for inspection

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm run dev` | Start API + worker together (watch mode) |
| `pnpm run dev:api` | Start API only |
| `pnpm run dev:worker` | Start worker only |
| `pnpm run setup` | Generate Prisma client + run migrations (one-time) |
| `pnpm run build` | Build all packages and apps |
| `pnpm run db:generate` | Generate Prisma client |
| `pnpm run db:migrate` | Create/apply migrations (development) |
| `pnpm run db:migrate:deploy` | Apply pending migrations (production) |
| `pnpm run db:migrate:status` | Check migration status |
| `pnpm run db:push` | Push schema directly without migrations (dev only) |

## Bonus Features

- Swagger/OpenAPI at `/docs`
- Pino request logging (built into Fastify)
- Pagination on `GET /events`
- Optimistic ticket availability check in booking transaction
- Graceful shutdown (API + worker)
- Health endpoint at `/health`