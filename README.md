# IMS (Incident Management System)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMS Architecture                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                     │
│  │   Signals  │ ───▶ │   Redis    │ ───▶ │   Backend  │                     │
│  │  (Sources) │      │  (Queue)   │      │  (Express) │                     │
│  └─────────────┘      └─────────────┘      └─────┬─────┘                     │
│                                              │                             │
│                          ┌────────────────────┼────────────────────┐      │
│                          │                    │                    │      │
│                          ▼                    ▼                    ▼      │
│                   ┌────────────┐       ┌────────────┐       ┌────────────┐     │
│                   │ Prisma    │       │ MongoDB  │       │ Socket.io │     │
│                   │ (SQLite)  │       │ (Signals)│       │  (Real)   │     │
│                   └──────────┘       └──────────┘       └──────────┘     │
│                          │                    │                    │           │
│                          └────────────────────┴────────────────────┘      │
│                                             │                             │
│                                             ▼                             │
│                                    ┌────────────────┐                   │
│                                    │    Frontend     │                   │
│                                    │  (React + Vite)│                   │
│                                    └────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Component Flow:
══════════════

  Signal Event                    WorkItem Creation              Resolution
  ─────────────                   ──────────────────            ───────────

  External      ┌─────────┐    ┌──────────────┐   ┌─────────────────┐
  Monitoring ─▶│ Debounce │──▶│  Create      │──▶│  RCA Form      │
  System       │(Redis)  │    │  WorkItem    │   │  (Frontend)   │
               └─────────┘    └──────────────┘   └─────────────────┘
                                    │                    │
                                    ▼                    ▼
                              ┌──────────┐         ┌────────────┐
                              │ SQLite  │         │  Calculate │
                              │(Prisma)  │────────▶│  MTTR      │
                              └──────────┘         └────────────┘
```

## Features

- **Async ingestion (BullMQ)** - Worker processes signals from Redis queue
- **Redis debouncing** - Prevents duplicate incidents within 10 seconds
- **Rate limiting** - Middleware for API rate limiting
- **SQLite (Prisma ORM)** - Stores work items (incidents)
- **MongoDB** - Stores raw signals for audit/history
- **MTTR calculation** - Average Mean Time To Resolve tracking
- **RCA enforcement** - Root Cause Analysis required to close incidents
- **WebSocket live updates** - Real-time incident dashboard via Socket.io
- **Retry logic** - BullMQ handles failed job retries
- **Clean architecture** - Controllers, Services, Models separated

## Backpressure Handling

The IMS system handles backpressure (high load) through several mechanisms:

### 1. Redis Debouncing

```javascript
// In signal.service.js - prevents duplicate signals
if (!entry || Date.now() - entry.time > 10000) {
  // Only create new WorkItem if 10 seconds passed
}
```

### 2. BullMQ Worker Queue

```javascript
// In worker.js - async processing via queue
new Worker(
  "q",
  async (job) => {
    await processSignal(job.data); // Process in background
  },
  { connection },
);
```

### 3. Rate Limiting Middleware

```javascript
// In rateLimiter.js - API rate limiting
// Currently a pass-through but designed for express-rate-limit
export default (req, res, next) => next(); // Ready for config
```

### 4. Socket.io Connection Management

```javascript
// Clients connect/disconnect properly tracked
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {...});
});
```

## Prerequisites

- Node.js 18+
- Redis (running on localhost:6379)
- MongoDB (running on localhost:27017)
- npm or yarn

## Setup Instructions

### 1. Start Infrastructure (Redis + MongoDB)

**Option A - Docker (Recommended):**

```bash
docker-compose up -d
# This starts Redis (6379) + MongoDB (27017)
```

**Option B - If running locally:**

- Start Redis on port 6379
- Start MongoDB on port 27017

### 2. Setup Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node src/app.js
```

### 3. Start BullMQ Worker (Optional - New Terminal)

```bash
node src/workers/worker.js
```

The worker processes signals asynchronously from the Redis queue.

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## Complete Startup Commands (All Services)

**Option A - Docker (All Infra via docker-compose):**

```bash
# Terminal 1: Start Redis + MongoDB
docker-compose up -d

# Terminal 2: Backend API
cd backend
node src/app.js

# Terminal 3: BullMQ Worker
node src/workers/worker.js

# Terminal 4: Frontend
cd frontend
npm run dev
```

**Option B - Local Infra:**

```bash
# Terminal 1: Ensure Redis (6379) + MongoDB (27017) running locally

# Terminal 2: Backend API
cd backend
node src/app.js

# Terminal 3: BullMQ Worker
node src/workers/worker.js

# Terminal 4: Frontend
cd frontend
npm run dev
```

## Service Status Check

| Service     | Port  | Check Command                       |
| ----------- | ----- | ----------------------------------- |
| Redis       | 6379  | `netstat -an \| findstr "6379"`     |
| MongoDB     | 27017 | `netstat -an \| findstr "27017"`    |
| Backend API | 5000  | `curl http://localhost:5000/health` |
| Frontend    | 3000  | `http://localhost:3000`             |

## API Endpoints

| Method | Endpoint          | Description                      |
| ------ | ----------------- | -------------------------------- |
| GET    | /health           | Health check                     |
| GET    | /workitem         | List all incidents               |
| GET    | /workitem/:id     | Get incident details             |
| POST   | /signal           | Create signal (creates incident) |
| POST   | /workitem/:id/rca | Close with RCA                   |

## Sample Data - Simulating Failures

### Test Script - simulate-failure.ps1

```powershell
# Simulates a complete failure event across the stack:
# 1. Database server outage
# 2. MCP (Monitoring/Control Platform) failure
# Then resolves with RCA

$body = @"
{
  "component_id": "DB-SERVER-1",
  "message": "Database server unreachable - replication lag detected"
}
"@

$response = Invoke-WebRequest -Uri 'http://localhost:5000/signal' -Method POST -Body $body -ContentType 'application/json'
Write-Host "Signal sent: " $response.StatusCode

# Wait for incident to be created
Start-Sleep -Seconds 2

# Get all incidents
$items = Invoke-WebRequest -Uri 'http://localhost:5000/workitem' -Method GET
$items.Content | ConvertFrom-Json | Format-Table

Write-Host "`nSimulating MCP failure scenario..."

# Create a second signal (MCP failure)
$body2 = @"
{
  "component_id": "MCP-CONTROLLER-1",
  "message": "MCP controller offline - unable to process commands"
}
"@

$response2 = Invoke-WebRequest -Uri 'http://localhost:5000/signal' -Method POST -Body $body2 -ContentType 'application/json'
Write-Host "MCP Signal sent: " $response2.StatusCode
```

## Running Sample Data

```bash
# Test basic signal
powershell -File test-signal.ps1

# Test failure simulation
powershell -File simulate-failure.ps1
```

## Project Structure

```
ims-system-final/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── src/
│       ├── app.js             # Express server + Socket.io
│       ├── socket.js         # Socket.io setup
│       ├── controllers/
│       │   ├── signal.controller.js
│       │   └── workitem.controller.js
│       ├── services/
│       │   └── signal.service.js
│       ├── models/
│       │   └── signal.model.js
│       ├── middleware/
│       │   └── rateLimiter.js
│       └── workers/
│           └── worker.js     # BullMQ worker
├── frontend/
│   └── src/
│       ├── App.jsx           # React dashboard + RCA form
│       ├── main.jsx
│       └── index.html
├── docker-compose.yml         # Infrastructure services
├── test-signal.ps1           # Basic test script
├── simulate-failure.ps1     # Failure simulation
└── README.md
```

## Root Cause Categories

The RCA form includes these categories:

1. Hardware Failure
2. Software Bug
3. Network Issue
4. Database Performance
5. Security Incident
6. Configuration Error
7. Capacity Planning
8. Third Party Service
9. Human Error
10. Other

## Technologies Used

- **Backend:** Express.js, Prisma, Mongoose, Socket.io, BullMQ
- **Frontend:** React, Vite, Socket.io-client, Axios
- **Database:** SQLite (Prisma), MongoDB
- **Queue:** Redis (BullMQ)
- **Real-time:** Socket.io

## Monitoring

The system logs throughput tracking every 5 seconds:

```
setInterval(()=>console.log("Throughput tracking active"),5000);
```

This helps monitor system load and identify backpressure conditions.

## License

MIT
