Tutors API
==========

This project includes a small Tutors API that reads tutor data from `data/tutors.csv` (if present) or falls back to `lib/stem-center-data.ts`.

Endpoints
---------

- GET /api/tutors
  - Returns JSON: { tutors: Tutor[] }
  - If `TOKEN_AUTH=true` in env, requires `Authorization: Bearer <token>` header.

- GET /api/tutors/:id
  - Returns JSON: { tutor: Tutor } or 404 if not found

- POST /api/auth/token
  - Body: { "password": "..." }
  - If `API_AUTH_PASSWORD` env var is set, the password must match.
  - Returns JSON: { token: "..." }

Environment
-----------

Create a `.env.local` with any of these vars (examples):

TOKEN_AUTH=false
TOKEN_SECRET=your-secret
API_AUTH_PASSWORD=devpass

If `TOKEN_AUTH=false` (default), the tutors endpoints are public for local testing.

Examples
--------

# Start dev server
npm install
npm run dev

# Get tutor list (no auth)
curl -sS http://localhost:3000/api/tutors | jq .

# Request token (if using auth)
curl -sS -X POST http://localhost:3000/api/auth/token -H "Content-Type: application/json" -d '{"password":"devpass"}' | jq .

# Use token
# TOKEN=$(curl -sS -X POST http://localhost:3000/api/auth/token -H "Content-Type: application/json" -d '{"password":"devpass"}' | jq -r .token)
# curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/tutors | jq .

Notes
-----

The CSV parser here is intentionally simple and expects a header row with columns: `id,name,subjects,schedule,email`. Subjects may be separated by `;`.
