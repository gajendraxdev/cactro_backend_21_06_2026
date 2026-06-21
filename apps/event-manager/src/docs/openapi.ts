/** Shared OpenAPI / Swagger schema definitions for the Event Booking API. */

export const API_DESCRIPTION = `
Event Booking System REST API.

## Authentication
Most protected endpoints require a JWT Bearer token obtained from \`POST /auth/login\` or \`POST /auth/register\`.
Include the token in the \`Authorization\` header: \`Bearer <accessToken>\`.

## Roles
| Role | Description |
|------|-------------|
| **ORGANIZER** | Can create, update, and delete their own events |
| **CUSTOMER** | Can book tickets and view their own bookings |

## Response format
**Success:** \`{ "success": true, "data": ... }\` or paginated \`{ "success": true, "data": [...], "meta": {...} }\`

**Error:** \`{ "success": false, "message": "...", "errors": [] }\`
`.trim();

export const TAGS = [
  {
    name: "Health",
    description: "Service health and readiness checks.",
  },
  {
    name: "Auth",
    description:
      "User registration and login. Passwords are hashed with Argon2. Returns a JWT access token.",
  },
  {
    name: "Events",
    description:
      "Browse and manage events. Public read access. Only ORGANIZER role can create, update, or delete events they own.",
  },
  {
    name: "Bookings",
    description:
      "Ticket booking for CUSTOMER role. Bookings run in a database transaction to prevent overbooking and trigger a background confirmation job.",
  },
] as const;

// ─── Enums ───────────────────────────────────────────────────────────────────

export const UserRoleEnum = {
  type: "string" as const,
  enum: ["ORGANIZER", "CUSTOMER"],
  description:
    "User role. ORGANIZER = create/manage own events. CUSTOMER = book tickets and view own bookings.",
};

export const EventSortByEnum = {
  type: "string" as const,
  enum: ["eventDate", "createdAt", "title"],
  description: "Field to sort events by. Default: eventDate.",
};

export const SortOrderEnum = {
  type: "string" as const,
  enum: ["asc", "desc"],
  description: "Sort direction. Default: asc.",
};

// ─── Reusable schemas ────────────────────────────────────────────────────────

export const ErrorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", enum: [false], description: "Always false on error." },
    message: { type: "string", description: "Human-readable error message." },
    errors: {
      type: "array",
      items: { type: "string" },
      description: "Optional list of validation or detail messages.",
    },
  },
  required: ["success", "message", "errors"],
};

const errorResponse = (description: string) => ({
  ...ErrorResponseSchema,
  description,
});

export const PaginationMetaSchema = {
  type: "object",
  description: "Pagination metadata for list endpoints.",
  properties: {
    page: { type: "integer", description: "Current page number (1-based)." },
    limit: { type: "integer", description: "Items per page (max 100)." },
    total: { type: "integer", description: "Total matching records." },
    totalPages: { type: "integer", description: "Total number of pages." },
  },
  required: ["page", "limit", "total", "totalPages"],
};

export const PublicUserSchema = {
  type: "object",
  description: "User profile returned after auth (password never included).",
  properties: {
    id: { type: "string", description: "Unique user ID (cuid)." },
    name: { type: "string", description: "Display name (e.g. Alice Organizer)." },
    email: { type: "string", format: "email", description: "Email address (e.g. alice@example.com)." },
    role: UserRoleEnum,
    createdAt: { type: "string", format: "date-time", description: "Account creation timestamp." },
  },
  required: ["id", "name", "email", "role", "createdAt"],
};

export const AuthDataSchema = {
  type: "object",
  description: "Authentication result with user profile and JWT access token.",
  properties: {
    user: PublicUserSchema,
    accessToken: {
      type: "string",
      description:
        "JWT bearer token. Payload: { userId, email, role }. Use in Authorization header.",
    },
  },
  required: ["user", "accessToken"],
};

export const OrganizerSummarySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
  },
};

export const EventSchema = {
  type: "object",
  description: "Event with ticket inventory.",
  properties: {
    id: { type: "string", description: "Unique event ID (cuid)." },
    title: { type: "string", description: "Event title (e.g. Tech Conference 2026)." },
    description: { type: "string", description: "Full event description." },
    location: { type: "string", description: "Event location (e.g. San Francisco, CA)." },
    eventDate: { type: "string", format: "date-time", description: "When the event takes place (ISO 8601)." },
    totalTickets: { type: "integer", description: "Maximum ticket capacity." },
    availableTickets: {
      type: "integer",
      description: "Tickets still available for booking.",
    },
    organizerId: { type: "string", description: "ID of the ORGANIZER who owns this event." },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    organizer: OrganizerSummarySchema,
  },
  required: [
    "id",
    "title",
    "description",
    "location",
    "eventDate",
    "totalTickets",
    "availableTickets",
    "organizerId",
    "createdAt",
    "updatedAt",
  ],
};

export const BookingSchema = {
  type: "object",
  description: "A ticket booking made by a customer.",
  properties: {
    id: { type: "string", description: "Unique booking ID (cuid)." },
    quantity: { type: "integer", description: "Number of tickets booked." },
    customerId: { type: "string", description: "ID of the CUSTOMER who made the booking." },
    eventId: { type: "string", description: "ID of the booked event." },
    createdAt: { type: "string", format: "date-time" },
    event: {
      type: "object",
      description: "Nested event summary (included on create / list).",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        location: { type: "string" },
        eventDate: { type: "string", format: "date-time" },
      },
    },
  },
  required: ["id", "quantity", "customerId", "eventId", "createdAt"],
};

// ─── Route schemas ───────────────────────────────────────────────────────────

export const healthRouteSchema = {
  tags: ["Health"],
  summary: "Health check",
  description:
    "Returns service status and current server timestamp. No authentication required. Use for load balancer or uptime monitoring.",
  response: {
    200: {
      description: "Service is healthy.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok"], description: "Health status." },
            timestamp: { type: "string", format: "date-time", description: "Current server time (ISO 8601)." },
          },
          required: ["status", "timestamp"],
        },
      },
    },
  },
};

export const registerRouteSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description: `Creates a new user account and returns a JWT access token.

**Role options:**
- \`ORGANIZER\` — for users who will create and manage events
- \`CUSTOMER\` — for users who will book tickets

Password must be at least 8 characters. Stored using Argon2 hashing.`,
  body: {
    type: "object",
    required: ["name", "email", "password", "role"],
    properties: {
      name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        description: "Full name of the user (e.g. Alice Organizer).",
      },
      email: {
        type: "string",
        format: "email",
        description: "Unique email address. Returns 409 if already registered.",
      },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 128,
        description: "Plain-text password (min 8 chars). Hashed with Argon2 before storage.",
      },
      role: UserRoleEnum,
    },
  },
  response: {
    200: {
      description: "User registered successfully.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: AuthDataSchema,
      },
    },
    400: errorResponse("Validation failed (invalid email, short password, invalid role)."),
    409: errorResponse("Email already registered."),
  },
};

export const loginRouteSchema = {
  tags: ["Auth"],
  summary: "Login",
  description:
    "Authenticates a user with email and password. Returns user profile and JWT access token.",
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Registered email address.",
      },
      password: {
        type: "string",
        description: "Account password.",
      },
    },
  },
  response: {
    200: {
      description: "Login successful.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: AuthDataSchema,
      },
    },
    401: errorResponse("Invalid email or password."),
  },
};

export const createEventRouteSchema = {
  tags: ["Events"],
  summary: "Create an event",
  description: `Creates a new event owned by the authenticated ORGANIZER.

\`availableTickets\` is automatically set equal to \`totalTickets\` on creation.

**Requires:** JWT + ORGANIZER role`,
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["title", "description", "location", "eventDate", "totalTickets"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200, description: "Event title." },
      description: { type: "string", minLength: 1, maxLength: 5000, description: "Event description." },
      location: { type: "string", minLength: 1, maxLength: 300, description: "Event location." },
      eventDate: {
        type: "string",
        format: "date-time",
        description: "Event start date/time (ISO 8601, e.g. 2026-09-15T09:00:00.000Z).",
      },
      totalTickets: {
        type: "integer",
        minimum: 1,
        description: "Total ticket capacity for this event.",
      },
    },
  },
  response: {
    201: {
      description: "Event created.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: EventSchema,
      },
    },
    400: errorResponse("Validation error."),
    401: errorResponse("Missing or invalid JWT."),
    403: errorResponse("User is not an ORGANIZER."),
  },
};

export const listEventsRouteSchema = {
  tags: ["Events"],
  summary: "List events",
  description: `Returns a paginated list of events. **Public — no auth required.**

**Query parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| \`page\` | 1 | Page number (1-based) |
| \`limit\` | 10 | Items per page (max 100) |
| \`sortBy\` | eventDate | Sort field: \`eventDate\`, \`createdAt\`, \`title\` |
| \`sortOrder\` | asc | Sort direction: \`asc\` or \`desc\` |
| \`from\` | — | Filter events on or after this date (ISO 8601) |
| \`to\` | — | Filter events on or before this date (ISO 8601) |`,
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1, description: "Page number (1-based)." },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10, description: "Items per page." },
      sortBy: EventSortByEnum,
      sortOrder: SortOrderEnum,
      from: { type: "string", format: "date-time", description: "Inclusive start of eventDate range." },
      to: { type: "string", format: "date-time", description: "Inclusive end of eventDate range." },
    },
  },
  response: {
    200: {
      description: "Paginated event list.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: { type: "array", items: EventSchema },
        meta: PaginationMetaSchema,
      },
    },
  },
};

export const getEventRouteSchema = {
  tags: ["Events"],
  summary: "Get event by ID",
  description: "Returns a single event with organizer details. **Public — no auth required.**",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", description: "Event ID (cuid)." },
    },
  },
  response: {
    200: {
      description: "Event found.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: EventSchema,
      },
    },
    404: errorResponse("Event not found."),
  },
};

export const updateEventRouteSchema = {
  tags: ["Events"],
  summary: "Update an event",
  description: `Updates an event. Only the owning ORGANIZER may modify it.

All body fields are optional (partial update). If \`totalTickets\` is reduced below already-booked count, returns 400.

On success, publishes an \`event-update-notification\` background job to notify booked customers.

**Requires:** JWT + ORGANIZER role + event ownership`,
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", description: "Event ID to update." },
    },
  },
  body: {
    type: "object",
    description: "All fields optional. Only provided fields are updated.",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200 },
      description: { type: "string", minLength: 1, maxLength: 5000 },
      location: { type: "string", minLength: 1, maxLength: 300 },
      eventDate: { type: "string", format: "date-time" },
      totalTickets: {
        type: "integer",
        minimum: 1,
        description: "New total capacity. availableTickets is recalculated automatically.",
      },
    },
  },
  response: {
    200: {
      description: "Event updated.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: EventSchema,
      },
    },
    400: errorResponse("Validation error or totalTickets below booked count."),
    401: errorResponse("Missing or invalid JWT."),
    403: errorResponse("Not the event owner or not an ORGANIZER."),
    404: errorResponse("Event not found."),
  },
};

export const deleteEventRouteSchema = {
  tags: ["Events"],
  summary: "Delete an event",
  description: `Permanently deletes an event and cascades to all associated bookings.

Only the owning ORGANIZER may delete.

**Requires:** JWT + ORGANIZER role + event ownership`,
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", description: "Event ID to delete." },
    },
  },
  response: {
    200: {
      description: "Event deleted.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: {
          type: "object",
          properties: {
            message: { type: "string", description: "Confirmation message (Event deleted)." },
          },
        },
      },
    },
    401: errorResponse("Missing or invalid JWT."),
    403: errorResponse("Not the event owner or not an ORGANIZER."),
    404: errorResponse("Event not found."),
  },
};

export const createBookingRouteSchema = {
  tags: ["Bookings"],
  summary: "Book tickets",
  description: `Books tickets for an event on behalf of the authenticated CUSTOMER.

**Booking flow:**
1. Validates event exists
2. Checks \`availableTickets >= quantity\`
3. Creates booking in a Prisma transaction (prevents overbooking)
4. Decrements \`availableTickets\`
5. Publishes a \`booking-confirmation\` background job

**Requires:** JWT + CUSTOMER role`,
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["eventId", "quantity"],
    properties: {
      eventId: {
        type: "string",
        description: "ID of the event to book (cuid).",
      },
      quantity: {
        type: "integer",
        minimum: 1,
        description: "Number of tickets to book.",
      },
    },
  },
  response: {
    201: {
      description: "Booking created.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: BookingSchema,
      },
    },
    400: errorResponse("Validation error."),
    401: errorResponse("Missing or invalid JWT."),
    403: errorResponse("User is not a CUSTOMER."),
    404: errorResponse("Event not found."),
    409: errorResponse("Not enough tickets available."),
  },
};

export const getMyBookingsRouteSchema = {
  tags: ["Bookings"],
  summary: "Get my bookings",
  description: `Returns all bookings for the authenticated CUSTOMER, ordered by newest first.

Each booking includes a summary of the associated event (title, location, date, etc.).

**Requires:** JWT + CUSTOMER role`,
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "List of customer bookings.",
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        data: { type: "array", items: BookingSchema },
      },
    },
    401: errorResponse("Missing or invalid JWT."),
    403: errorResponse("User is not a CUSTOMER."),
  },
};