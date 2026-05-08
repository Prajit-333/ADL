# API Routes & Postman Sample Data

Based on the current state of the monorepo, only the backend skeleton and **Auth Service (`apps/auth`)** routes are currently defined. The rest of the platform (API, WebSockets) is scaffolded but awaiting your route implementations based on our earlier architecture plan.

Here are the actively defined routes you can test in Postman right now.

---

## 1. Auth Service Routes

By default, assuming your Turborepo starts the auth service on the configured port (e.g., `3000` or `7003` as hinted in your gateway), map these accordingly in Postman. Assumed base URL: `http://localhost:3000/auth` (or `/api/v1/auth` if you mount it there).

### A. User Registration
Creates a new User securely in the database.

- **Method**: `POST`
- **Route**: `/register`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON):**
```json
{
  "name": "Sunil Kumar",
  "email": "sunil.admin@college.edu",
  "password": "SecurePassword123!",
  "role": "COLLEGE_ADMIN",
  "collegeId": "c4d7f573-0000-4b8c-b1b0-1abcd123456" 
}
```
*(Note: `collegeId` is only needed if your Controller specifically validates it, as per our multi-tenancy schema. `SUPER_ADMIN` can omit this).*

### B. User Login
Authenticates the user and should return the JWT Session.

- **Method**: `POST`
- **Route**: `/login`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON):**
```json
{
  "email": "sunil.admin@college.edu",
  "password": "SecurePassword123!"
}
```

---

## What's Next for Postman?

Once you implement the **Tracking Service (`apps/api`)** controllers we discussed in **Part 3** of the architecture design, you will add routes like:

### C. Create Bus (Planned)
- **Method**: `POST` 
- **Route**: `/api/buses`

**Sample Body:**
```json
{
  "collegeId": "c4d7f573-0000-4b8c-b1b0-1abcd123456",
  "plateNumber": "KA-01-AB-1234",
  "capacity": 55,
  "gpsDeviceId": "GPS-TRACKER-009"
}
```

### D. Start Trip (Planned)
- **Method**: `POST`
- **Route**: `/api/trips/start`

**Sample Body:**
```json
{
  "busId": "bus-uuid-here",
  "routeId": "route-uuid-here",
  "driverId": "driver-uuid-here"
}
```
