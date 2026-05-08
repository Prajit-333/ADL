# ADL: Real-Time Public Transport Tracking System

A production-grade, scalable backend system for real-time bus tracking, fleet management, and role-based authentication. Built with a clean OOP-based architecture and SOLID principles.

## 🚀 Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: Express.js (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod
- **Architecture**: Monorepo with OOP (Controller -> Service -> Repository)
- **Security**: Bcrypt (Password Hashing)

## 📁 Project Structure

```text
/ADL
├── apps/
│   └── api/                  # Main Express Application
│       ├── src/
│       │   ├── controllers/  # Request/Response Handling
│       │   ├── services/     # Business Logic
│       │   ├── repositories/ # Database Access (Repository Pattern)
│       │   ├── schemas/      # Zod Validation DTOs
│       │   ├── routes/       # Centralized Routing
│       │   ├── middlewares/  # Error & Validation Middlewares
│       │   ├── utils/        # ApiError & ApiResponse Helpers
│       │   └── config/       # Database & Environment Config
│       └── index.ts          # Server Entry Point
├── packages/
│   └── db/                   # Prisma Schema & Client
└── ...
```

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Environment Variables**:
   Create a `.env` file in `packages/db` and `apps/api`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   PORT=3009
   ```

3. **Prisma Setup**:
   ```bash
   cd packages/db
   bunx prisma generate
   bunx prisma db push
   ```

4. **Run Dev Server**:
   ```bash
   bun run dev
   ```

---

## 📍 API Reference (v1)

Base URL: `http://localhost:3009/api/v1`

### 1. College Module
- `POST   /colleges`       - Create a new college
- `GET    /colleges`       - List all colleges
- `GET    /colleges/:id`   - Get college details
- `PATCH  /colleges/:id`   - Update college
- `DELETE /colleges/:id`   - Hard delete college

### 2. User Module
- `POST   /users`          - Create user (Handles password hashing)
- `GET    /users`          - List all users
- `GET    /users/:id`      - Get user profile
- `PATCH  /users/:id`      - Update user
- `DELETE /users/:id`      - Delete user

### 3. Driver Module
- `POST   /drivers`        - Link Driver Profile to a DRIVER User
- `GET    /drivers`        - List all driver profiles
- `PATCH  /drivers/:id`    - Update license/phone
- `DELETE /drivers/:id`    - Delete profile

### 4. Vehicle Module
- `POST   /vehicles`       - Register a vehicle (Registration & GPS must be unique)
- `GET    /vehicles`       - List fleet
- `GET    /vehicles/:id`   - Vehicle status & assignment history

### 5. Route & Stops
- `POST   /routes`                - Create dynamic route
- `POST   /routes/:id/stops`      - Add sequence-validated stops
- `GET    /routes/:id`            - Get route map (Ordered stops)
- `PATCH  /routes/stops/:id`      - Reorder or update stop

### 6. Vehicle Assignment
- `POST   /assignments`    - Assign Vehicle to Driver + Route
- `PATCH  /assignments/:id` - End assignment / Change route

### 7. Trip Lifecycle
- `POST   /trips/start`           - Start a live trip
- `PATCH  /trips/:id/end`         - End a trip (Status COMPLETED)
- `GET    /trips/:id`             - Trip details & recorded telemetry

### 8. Location Telemetry
- `POST   /location/update`       - Post GPS coordinates (Auto-links to active trip)
- `GET    /location/vehicles/:id` - Get historical heat-map data

---

## 🔄 Correct Creation Flow (Production Order)

To ensure relational integrity, follow this sequence:

1. **Create College**: `POST /colleges` (Get `collegeId`)
2. **Create User**: `POST /users` (Set `role: DRIVER`, get `userId`)
3. **Create Profile**: `POST /drivers` (Link `userId`, get `driverId`)
4. **Create Vehicle**: `POST /vehicles` (Link `collegeId`, get `vehicleId`)
5. **Create Route**: `POST /routes` (Link `collegeId`, get `routeId`)
6. **Add Stops**: `POST /routes/:routeId/stops` (Build map)
7. **Assign Vehicle**: `POST /assignments` (Link `vehicleId` + `driverId` + `routeId`)
8. **Start Trip**: `POST /trips/start` (Get `tripId`)
9. **Update Location**: `POST /location/update` (Post live GPS)

---

## 🧱 Key Architectural Highlights

### Centralized Response Handler
Uniform JSON structure for every response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Business Validation (Zod)
Automatic payload validation at the route layer. Prevents garbage data from reaching the service layer.

### Exception Hierarchy
Custom `ApiError` class combined with a global `error.middleware.ts` ensures that even runtime crashes return valid JSON responses with appropriate HTTP status codes.

### Repository Pattern
Decouples Prisma ORM from business logic. Allows for easier unit testing and future database migrations (e.g., swapping SQL for NoSQL for Location History).

---

## 📈 Future Scaling (Kafka & WebSockets)

1. **Kafka Integration**: Move `POST /location/update` to a Kafka Producer for massive write throughput.
2. **WebSockets/Socket.io**: Broadcast `LocationHistory` updates to a "Live Tracking" namespace for frontend map rendering.
3. **Redis Caching**: Cache `findActiveTripByVehicle` and `RouteStops` in Redis to minimize database IO during high-frequency GPS pings.

---

## 📜 License
Internal Project. Restricted Usage.
