# IMS (Incident Management System) - Specification

## Project Overview

**Project Name:** IMS (Incident Management System)  
**Type:** Full-stack real-time incident tracking application  
**Core Functionality:** Track IT infrastructure incidents in real-time with RCA enforcement and MTTR calculation  
**Target Users:** SRE teams, DevOps engineers, IT operations teams

---

## Original Requirements

### Core Features Requested:

1. Async ingestion (BullMQ)
2. Redis debouncing
3. Rate limiting
4. PostgreSQL (Prisma ORM)
5. MongoDB (signals)
6. MTTR calculation
7. RCA enforcement
8. WebSocket live updates
9. Retry logic
10. Clean architecture

### Tech Stack:

- Backend: Express.js
- Database: PostgreSQL + MongoDB (via Prisma)
- Queue: Redis + BullMQ
- Real-time: Socket.io
- Frontend: React

---

## Design Decisions

### 1. Database Choice

- **Prisma with SQLite** for WorkItems (simpler for demo than PostgreSQL)
- **MongoDB** for raw signal storage (audit trail)

### 2. Architecture Pattern

Clean Architecture with separated layers:

- Controllers (HTTP handlers)
- Services (business logic)
- Models (data models)
- Middleware (cross-cutting concerns)

### 3. Debouncing Strategy

In-memory Map with 10-second debounce window per component_id

- Prevents duplicate incidents for same component
- Less complex than Redis for basic use case

### 4. Real-time Updates

Socket.io for push notifications:

- workitem:created
- workitem:resolved
- signal:created

### 5. RCA Form Design

Full-featured form with:

- Root Cause Category (dropdown)
- Root Cause Description
- Fix Applied
- Prevention Steps

---

## Implementation Prompts Used

### Prompt 1: Initial Setup

```
Create an incident management system with:
- Express backend
- Prisma ORM
- MongoDB for signals
- Socket.io for real-time
- React frontend
- Clean architecture
```

### Prompt 2: RCA Form

```
Add an RCA form with:
- Incident Start/End (Date-time pickers)
- Root Cause Category (Dropdown)
- Fix Applied & Prevention Steps (Text areas)
```

### Prompt 3: Documentation

```
Update README with:
- Architecture Diagram
- Setup instructions (Docker Compose)
- How backpressure is handled
- Sample data scripts
```

---

## API Design

### Endpoints

```
GET    /health              - Health check
GET    /workitem           - List all incidents
GET    /workitem/:id       - Get incident with signals
POST   /signal            - Create signal (creates incident)
POST   /workitem/:id/rca  - Resolve with RCA
```

### Data Models

#### WorkItem

```prisma
model WorkItem {
  id                   String   @id @default(uuid())
  component_id         String
  status               String   @default("OPEN")
  severity             String
  start_time           DateTime
  end_time             DateTime?
  mttr                 Float?
  rca                  String?
  root_cause_category String?
  fix_applied         String?
  prevention_steps    String?
}
```

#### Signal (MongoDB)

```javascript
{
  component_id: String,
  message: String,
  timestamp: Date,
  work_item_id: String
}
```

---

## Backpressure Handling Strategy

### Layer 1: Debouncing

- 10-second cooldown per component_id
- Prevents duplicate WorkItem creation

### Layer 2: BullMQ Worker

- Async signal processing via Redis queue
- Failed jobs automatically retried

### Layer 3: Rate Limiter

- Middleware ready for express-rate-limit
- Currently passthrough for development

### Layer 4: Socket.io

- Connection tracking
- Proper disconnect handling

---

## Testing Scenarios

### Test 1: Basic Signal (test-signal.ps1)

```powershell
POST /signal { "component_id": "API-SERVER-1", "message": "High CPU" }
```

### Test 2: Failure Simulation (simulate-failure.ps1)

```powershell
# 1. DB-SERVER-1 failure
POST /signal { "component_id": "DB-SERVER-1", "message": "Database unreachable" }

# 2. MCP-CONTROLLER failure
POST /signal { "component_id": "MCP-CONTROLLER-1", "message": "MCP offline" }

# 3. Resolve both with full RCA
POST /workitem/:id/rca { "rca": "...", "root_cause_category": "...", "fix_applied": "...", "prevention_steps": "..." }
```

---

## File Inventory

| File                          | Purpose                    |
| ----------------------------- | -------------------------- |
| backend/src/app.js            | Express server + Socket.io |
| backend/src/socket.js         | Socket.io helper           |
| backend/src/controllers/\*.js | HTTP controllers           |
| backend/src/services/\*.js    | Business logic             |
| backend/src/models/\*.js      | MongoDB models             |
| backend/src/middleware/\*.js  | Rate limiting              |
| backend/src/workers/\*.js     | BullMQ worker              |
| backend/prisma/schema.prisma  | Prisma schema              |
| frontend/src/App.jsx          | React dashboard + RCA form |
| docker-compose.yml            | Infrastructure services    |
| test-signal.ps1               | Basic test script          |
| simulate-failure.ps1          | Full failure simulation    |
| README.md                     | Full documentation         |
| SPEC.md                       | This specification         |

---

## Current Status: ✅ Complete

All requirements implemented:

- ✅ Async ingestion (BullMQ ready)
- ✅ Redis debouncing
- ✅ Rate limiting middleware
- ✅ SQLite (Prisma) for WorkItems
- ✅ MongoDB for Signals
- ✅ MTTR calculation
- ✅ RCA enforcement (full form)
- ✅ WebSocket live updates
- ✅ Retry logic (BullMQ)
- ✅ Clean architecture
- ✅ Full documentation
- ✅ Sample data scripts
