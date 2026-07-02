# Restaurant Reservation Management System

A full-stack reservation system for a single restaurant. Customers can book,
view, and cancel their own reservations; administrators can see and manage
every reservation and the restaurant's tables.

**Stack:** React (Vite) · Node.js/Express · MongoDB (Mongoose) · JWT auth

---

## 1. Project structure

```
restaurant-reservation-system/
├── backend/          Express API
│   ├── src/
│   │   ├── config/        MongoDB connection
│   │   ├── controllers/   Route handlers (auth, reservations, tables, admin)
│   │   ├── middleware/    JWT auth, role guard, validation, error handler
│   │   ├── models/        User, Table, Reservation (Mongoose schemas)
│   │   ├── routes/        Express routers
│   │   ├── scripts/       seedTables.js — seeds tables + a default admin
│   │   └── server.js
│   └── .env.example
└── frontend/          React (Vite) SPA
    ├── src/
    │   ├── api/            axios client with JWT interceptor
    │   ├── context/        AuthContext (login/register/logout, current user)
    │   ├── components/     Navbar, ProtectedRoute (role-based routing)
    │   └── pages/           Login, Register, CustomerDashboard, AdminDashboard
    └── .env.example
```

## 2. Setup instructions

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local MongoDB or a free MongoDB Atlas cluster)

### Backend
```bash
cd backend
cp .env.example .env     # fill in MONGO_URI and a strong JWT_SECRET
npm install
npm run seed              # creates 6 tables + a default admin account
npm run dev                # starts the API on http://localhost:5000
```
The seed script prints the default admin credentials (email/password), also
configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before
running `npm run seed`.

### Frontend
```bash
cd frontend
cp .env.example .env     # VITE_API_URL should point at the backend, e.g. http://localhost:5000/api
npm install
npm run dev                # starts the app on http://localhost:5173
```

Register a normal account to use the customer flow, or log in with the
seeded admin account to use the admin dashboard.

## 3. Assumptions made

- **Single restaurant, fixed tables.** Tables are seeded once via a script
  rather than created through onboarding UI (admins can still add/deactivate
  tables from the dashboard).
- **Fixed time slots** rather than free-form start/end times: `12:00–13:30`,
  `13:30–15:00`, `18:00–19:30`, `19:30–21:00`, `21:00–22:30`. This keeps
  overlap detection unambiguous — see below.
- **Every self-registered account is a customer.** There is no public
  sign-up flow for admins; the `role` field is never accepted from the
  registration request body, only set server-side. Admin accounts exist
  only via the seed script or direct DB creation.
- **A reservation belongs to exactly one table** for its whole slot (no
  partial/shared tables, no combining tables for large parties).
- **Cancelled reservations free up the slot** immediately and don't count
  toward conflicts.
- Dates are compared as calendar days (UTC midnight), not exact timestamps.

## 4. Reservation & availability logic

This was the key area of the assignment, so it's enforced at two levels:

**1. Application-level checks (`reservationController.js` /
`adminController.js`), in order:**
1. The time slot must be one of the fixed enum values.
2. The date must be valid and not in the past.
3. The table must exist and be active.
4. `guests` must not exceed the table's `capacity`.
5. An explicit query checks whether a **confirmed** reservation already
   exists for that `table + date + timeSlot`. If so, the API returns
   `409 Conflict` with a clear message instead of a generic error.

**2. Database-level safety net:** the `Reservation` model has a **partial
unique index** on `{ table, reservationDate, timeSlot }`, scoped to
`status: 'confirmed'`. Even if two requests race past the application-level
check at the same instant, MongoDB itself will reject the second insert
(caught and translated into a friendly `409`). This is what actually
guarantees "no double bookings" under concurrency, not just the pre-check.

**Availability endpoint:** `GET /api/reservations/availability?date=&guests=`
returns, for every table that can seat the party, which slots are still
free. The frontend only lets customers pick from this list, so in the
common case they never even attempt a conflicting booking.

**Admin edits** (`PATCH /api/admin/reservations/:id`) re-run the same
conflict/capacity checks whenever the table, date, or slot actually changes,
so an admin can't accidentally create a double-booking either.

## 5. Role-based access control

- JWT is issued on login/register and contains the user's id and role.
- `middleware/auth.js` exports:
  - `protect` — verifies the JWT and attaches the user to `req.user`.
  - `authorize(...roles)` — 403s if `req.user.role` isn't in the allowed list.
- Route-level enforcement:
  - `/api/reservations/*` — any authenticated user; customers can only ever
    read/cancel **their own** reservations (checked against `req.user._id`
    in the controller, not just the route).
  - `/api/tables` (GET) — any authenticated user (customers need it to book);
    create/update/delete require `authorize('admin')`.
  - `/api/admin/*` — every route requires `authorize('admin')`.
- On the frontend, `ProtectedRoute` redirects unauthenticated users to
  `/login` and redirects users to `/` if their role doesn't match the
  route's allowed roles, so a customer can't navigate to `/admin` (the API
  would reject it anyway — the frontend guard is UX, not the real boundary).

## 6. API overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer account |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET  | `/api/auth/me` | Authenticated | Current user info |
| GET  | `/api/tables` | Authenticated | List tables (active-only for customers) |
| POST/PATCH/DELETE | `/api/tables[/:id]` | Admin | Manage tables |
| GET  | `/api/reservations/availability` | Authenticated | Free tables/slots for a date + party size |
| POST | `/api/reservations` | Authenticated | Create a reservation |
| GET  | `/api/reservations/me` | Authenticated | Own reservations |
| PATCH | `/api/reservations/:id/cancel` | Authenticated | Cancel own reservation |
| GET  | `/api/admin/reservations` | Admin | All reservations, filterable by `date`/`status` |
| PATCH | `/api/admin/reservations/:id` | Admin | Update any reservation |
| PATCH | `/api/admin/reservations/:id/cancel` | Admin | Cancel any reservation |

## 7. Deployment

- **Backend** — deploy `/backend` to Render/Railway (Node web service).
  `render.yaml` is included as a blueprint. Set `MONGO_URI`, `JWT_SECRET`,
  and `CLIENT_ORIGIN` (your deployed frontend URL) as environment variables.
- **Frontend** — deploy `/frontend` to Vercel/Netlify. Set `VITE_API_URL`
  to your deployed backend's `/api` URL. `vercel.json` handles SPA routing.
- Update `CLIENT_ORIGIN` on the backend once you know the frontend's final
  URL, so CORS allows it.

## 8. Known limitations

- No password reset / email verification flow.
- No table-combination logic for parties larger than any single table.
- Time slots are fixed rather than restaurant-configurable through the UI.
- No pagination on the admin "all reservations" list — fine at assignment
  scale, would need it for a real, high-volume restaurant.
- No automated test suite (manual verification only, given the 48h scope).

## 9. Areas for improvement with more time

- Add integration tests (e.g. Jest + Supertest) for the availability/conflict
  logic, since that's the most correctness-sensitive part of the system.
- Configurable time slots per restaurant/day instead of a hardcoded enum.
- Email confirmation/reminder notifications (explicitly out of scope here).
- Waitlist support when a requested slot is full.
- Audit log of admin edits to reservations.
