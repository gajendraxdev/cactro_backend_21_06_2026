# Build an Event Booking System using a TypeScript Monorepo

Build a production-style Event Booking System backend using modern TypeScript and a monorepo architecture.

## Tech Stack

Use the latest stable versions of:

* Node.js
* TypeScript
* Fastify
* PostgreSQL
* Prisma ORM
* Redis
* BullMQ
* JWT Authentication
* Zod validation
* pnpm workspaces
* Docker + docker-compose
* pino for logging
* dotenv for environment variables

---

# Monorepo Structure

```text
apps/
  event-manager/
  worker/

packages/
  db/
  queue/
  types/
  config/

docker-compose.yml
pnpm-workspace.yaml
```

Use pnpm workspaces.

---

# Applications

## event-manager

Main API service.

Responsibilities:

* Authentication
* Event CRUD
* Ticket booking
* Authorization
* Publish jobs to queue

Use Fastify with plugins and modular architecture.

Suggested structure:

```text
src/
  modules/
    auth/
    users/
    events/
    bookings/

  plugins/
  middleware/
  utils/
  app.ts
  server.ts
```

---

## worker

Separate process responsible for background jobs.

Structure:

```text
src/
  jobs/
    booking-confirmation.job.ts
    event-update-notification.job.ts

  worker.ts
```

Worker consumes BullMQ jobs from Redis.

No actual emails are required.

Use console.log to simulate notifications.

---

# Shared Packages

## packages/db

Contains:

* Prisma schema
* Prisma client singleton
* exports

Directory:

```text
packages/db/
  prisma/
    schema.prisma

  src/
    client.ts
    index.ts
```

---

## packages/types

Shared TypeScript types and enums.

Contains:

* UserRole enum
* Queue job payload types

Export everything.

---

## packages/queue

Contains:

* Redis connection
* Queue definitions
* Queue names
* Helper functions

Queues:

* booking-confirmation
* event-update-notification

---

## packages/config

Centralized configuration.

Expose:

* DATABASE_URL
* REDIS_URL
* JWT_SECRET

Validate using Zod.

---

# User Roles

Support two roles:

```ts
enum UserRole {
  ORGANIZER
  CUSTOMER
}
```

---

# Database Schema

## User

Fields:

* id
* name
* email
* password
* role
* createdAt
* updatedAt

Relations:

* organizer owns events
* customer owns bookings

---

## Event

Fields:

* id
* title
* description
* location
* eventDate
* totalTickets
* availableTickets
* organizerId
* createdAt
* updatedAt

Relations:

* belongs to organizer
* has many bookings

---

## Booking

Fields:

* id
* quantity
* customerId
* eventId
* createdAt

Relations:

* belongs to customer
* belongs to event

---

# Authentication

Implement:

POST /auth/register

POST /auth/login

Use:

* bcrypt
* JWT

Return access token.

Passwords must be hashed.

---

# Authorization

Implement role-based middleware.

Only ORGANIZER can:

* create event
* update event
* delete event

Only CUSTOMER can:

* book tickets
* view own bookings

Everyone can:

* browse events

---

# Event APIs

POST /events

GET /events

GET /events/:id

PATCH /events/:id

DELETE /events/:id

Features:

* pagination
* sorting
* filtering by date

Only organizers can modify events.

---

# Booking APIs

POST /bookings

GET /bookings/me

Booking flow:

1. Validate event exists.
2. Check available tickets.
3. Create booking transaction.
4. Decrement availableTickets.
5. Publish booking-confirmation job.

Use Prisma transaction.

Prevent overbooking.

---

# Background Task 1

Booking Confirmation

After successful booking:

Publish job:

```ts
{
  bookingId,
  customerId
}
```

Worker consumes job.

Simulate email:

```ts
console.log(
  "Booking confirmation email sent to customer ..."
)
```

No real email service.

---

# Background Task 2

Event Update Notification

Whenever organizer updates an event:

Find all bookings for that event.

Publish:

```ts
{
  eventId
}
```

Worker fetches all customers who booked.

Loop through them and print:

```ts
console.log(
  `Notify ${customer.email}: Event updated`
)
```

No real notifications.

---

# Queue System

Use BullMQ.

Redis connection must be shared.

Create queue names as constants.

Retry failed jobs 3 times.

Configure workers with concurrency.

---

# Validation

Use Zod.

Validate:

* register request
* login request
* create event request
* update event request
* booking request

Return proper HTTP errors.

---

# Error Handling

Implement centralized error handling.

Use custom AppError.

Return:

```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

---

# Logging

Use pino.

Log:

* server startup
* errors
* worker activity

Example:

```ts
logger.info("Booking confirmation job processed")
```

---

# Docker

Provide:

docker-compose.yml

Services:

* postgres
* redis
* event-manager
* worker

Use latest official images.

Expose reasonable ports.

---

# Environment Variables

Support:

DATABASE_URL

REDIS_URL

JWT_SECRET

PORT

NODE_ENV

---

# Code Quality

Requirements:

* strict TypeScript
* ESM modules
* async/await only
* singleton Prisma client
* dependency injection where appropriate
* reusable services
* modular architecture
* no duplicated code

---

# README

Create a professional README containing:

* architecture overview
* folder structure
* setup instructions
* environment variables
* API examples
* queue design
* design decisions
* assumptions

---

# Bonus Features

Implement:

* Swagger documentation
* request logging
* pagination
* optimistic ticket availability checks
* Docker support
* graceful shutdown
* health endpoint

Avoid unnecessary complexity.

Do not use NestJS.

Keep the architecture simple but production-oriented.
