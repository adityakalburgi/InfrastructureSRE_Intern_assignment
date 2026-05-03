# Prompt History - All Prompts Used to Build IMS

This document tracks all prompts used to create the IMS (Incident Management System).

---

## Order of Development

### 1. Initial Creation Prompt

```
Create an incident management system with:
- Express backend
- Prisma ORM
- MongoDB for signals
- Socket.io for real-time
- React frontend
- Clean architecture
- Features:
  - Async ingestion (BullMQ)
  - Redis debouncing
  - Rate limiting
  - PostgreSQL (Prisma ORM)
  - MongoDB (signals)
  - MTTR calculation
  - RCA enforcement
  - WebSocket live updates
  - Retry logic
  - Clean architecture
```

### 2. Project Structure

```
ims-system-final/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── app.js
│       ├── controllers/
│       ├── services/
│       ├── models/
│       ├── middleware/
│       └── workers/
└── frontend/src/App.jsx
```

### 3. Error Fixing Phase

**Issue:** signal.service.js missing imports
**Prompt:** Fix the signal.service.js file - it has missing prisma and Signal imports

**Issue:** worker.js missing Prisma import
**Prompt:** Add PrismaClient import to worker.js

**Issue:** Socket.io not initialized
**Prompt:** Fix app.js to integrate Socket.io with HTTP server

**Issue:** Signal controller needs io
**Prompt:** Update signal.controller.js to emit Socket.io events

**Issue:** Workitem controller needs socket events
**Prompt:** Update workitem.controller.js to emit Socket.io events on RCA submission

**Issue:** MTTR calculation
**Prompt:** Fix MTTR calculation in workitem.controller.js to use actual time difference

### 4. RCA Form Feature

**Prompt:** Add full RCA form with:

- Incident Start/End (Date-time pickers)
- Root Cause Category (Dropdown)
- Fix Applied & Prevention Steps (Text areas)

**Changes Made:**

1. Extended Prisma schema with new fields
2. Updated workitem.controller.js endpoint
3. Created full React form with Socket.io

### 5. Documentation

**Prompt:** Update README.md with:

- Architecture Diagram
- Setup instructions (Docker Compose)
- How backpressure is handled
- Sample data scripts

**Prompt:** Create sample data script to mock:

- RDBMS outage
- MCP failure
- Full RCA resolution

---

## Files Created/Modified

| File                                           | Action           | Purpose                   |
| ---------------------------------------------- | ---------------- | ------------------------- |
| backend/src/app.js                             | Modified         | Add Socket.io integration |
| backend/src/socket.js                          | Existing         | Socket helper             |
| backend/src/services/signal.service.js         | Fixed            | Add missing imports       |
| backend/src/workers/worker.js                  | Fixed            | Add Prisma import         |
| backend/src/controllers/signal.controller.js   | Modified         | Emit socket events        |
| backend/src/controllers/workitem.controller.js | Modified         | Socket events + MTTR      |
| backend/prisma/schema.prisma                   | Extended         | Add RCA fields            |
| frontend/src/App.jsx                           | Complete Rewrite | Dashboard + RCA form      |
| test-signal.ps1                                | Existing         | Basic test                |
| simulate-failure.ps1                           | Created          | Full failure simulation   |
| README.md                                      | Complete Rewrite | Full documentation        |
| SPEC.md                                        | Created          | Project specification     |
| PROMPT_HISTORY.md                              | Created          | This file                 |

---

## Testing Commands

```bash
# Start services
docker-compose up -d

# Setup backend
cd backend
npm install
npx prisma generate
npx prisma db push
node src/app.js

# Start frontend
cd frontend
npm install
npm run dev

# Test
powershell -File test-signal.ps1
powershell -File simulate-failure.ps1

# View results
curl http://localhost:5000/workitem
# Open http://localhost:3000
```

---

## Key Design Patterns

1. **Debouncing** - In-memory Map with 10s window
2. **Async Processing** - BullMQ worker for queue
3. **Real-time Updates** - Socket.io push to frontend
4. **RCA Enforcement** - Must submit RCA to close incident
5. **MTTR Calculation** - Time from start to resolution

---

## Summary

The IMS was built iteratively:

1. Created initial structure with all files
2. Fixed missing imports and integrations
3. Added RCA form feature
4. Created comprehensive documentation
5. Added sample test scripts
