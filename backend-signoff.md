# Frontend Integration Spec — notebook-todo backend

This file is the single source of truth for a frontend agent doing integration testing against the live backend.

---

## 1. Start the backend

```bash
# From project root
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Requires:
- Java 21+
- MongoDB running locally on port 27017 (default install, no auth needed)

The dev profile connects to `mongodb://localhost:27017/notebooktodo-dev` and enables DEBUG logging.

Backend is ready when you see:
```
Started NotebookTodoApplication in X.XXX seconds
```

Base URL: `http://localhost:8080`

---

## 2. MongoDB — connect and inspect

```bash
# Open Mongo shell
mongosh mongodb://localhost:27017/notebooktodo-dev

# List all day documents
db.days.find().pretty()

# Check indexes (TTL and unique-date should be present)
db.days.getIndexes()

# Wipe everything for a clean test run
db.days.drop()
```

Expected indexes on `days` collection:
- `{ date: 1 }` — unique
- `{ expiresAt: 1 }` — TTL, `expireAfterSeconds: 0`

---

## 3. CORS

Allowed origin (dev): `http://localhost:5173`

All `/api/**` routes allow: `GET POST PATCH DELETE`

If your frontend runs on a different port, restart the backend with:
```bash
CORS_ORIGIN=http://localhost:3000 ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 4. Data shapes

### Task (embedded in Day)
```jsonc
{
  "id": "uuid-string",
  "text": "Buy groceries",
  "done": false,
  "priority": 0,          // 0 = none, 1/2/3 = unique priority slots
  "createdAt": "2026-05-15T10:00:00Z",
  "completedAt": null,    // set when done=true, cleared when done=false
  "carriedFrom": null     // "2026-05-14" (LocalDate) if pulled from a past day
}
```

### Day (full document)
```jsonc
{
  "id": "mongo-object-id",
  "date": "2026-05-15",
  "dayOfWeek": "Thursday",
  "tasks": [ /* Task[] */ ],
  "createdAt": "2026-05-15T00:00:00Z",
  "carryForwardPrompted": false,
  "expiresAt": "2026-05-22T00:00:00Z"
}
```

### TodayResponse (GET /api/days/today)
```jsonc
{
  "day": { /* Day */ },
  "shouldPromptCarryForward": true,   // true when yesterday has unfinished tasks AND carryForwardPrompted=false
  "yesterdayUnfinishedTasks": [ /* Task[] */ ]
}
```

### DayFeedItem (GET /api/days)
```jsonc
{
  "date": "2026-05-15",
  "dayOfWeek": "Thursday",
  "taskCount": 5,
  "completedCount": 2
}
```

### ErrorResponse (4xx / 5xx)
```jsonc
{
  "status": 404,
  "error": "Not Found",
  "message": "Day not found: 2026-01-01",
  "timestamp": "2026-05-15T10:00:00Z"
}
```

---

## 5. API reference with example curl commands

### GET /api/days/today
Returns today's Day, creating one if it doesn't exist yet. Also returns carry-forward prompt state.

```bash
curl -s http://localhost:8080/api/days/today | jq .
```

---

### POST /api/days/today/carry-forward
Body must always include `taskIds` (can be empty array to dismiss without carrying).

```bash
# Carry specific tasks from yesterday
curl -s -X POST http://localhost:8080/api/days/today/carry-forward \
  -H "Content-Type: application/json" \
  -d '{"taskIds": ["<task-id-from-yesterday>"]}'

# Dismiss prompt without carrying anything
curl -s -X POST http://localhost:8080/api/days/today/carry-forward \
  -H "Content-Type: application/json" \
  -d '{"taskIds": []}'
```

Response: `204 No Content`

---

### GET /api/days
Sidebar feed — last 7 days, newest first. Returns `DayFeedItem[]` (no embedded tasks).

```bash
curl -s http://localhost:8080/api/days | jq .
```

---

### GET /api/days/{date}
Full day document for a past date. `404` if not found.

```bash
curl -s http://localhost:8080/api/days/2026-05-14 | jq .
```

---

### POST /api/days/today/tasks
Add a task to today. `text` is required. `priority` defaults to `0`.

```bash
# No priority
curl -s -X POST http://localhost:8080/api/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"text": "Write tests"}'

# With priority slot
curl -s -X POST http://localhost:8080/api/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"text": "Critical task", "priority": 1}'
```

Response: `201 Created` + the new `Task` object.

---

### PATCH /api/days/today/tasks/{id}
Partial update — send only the fields you want to change.

```bash
# Mark done
curl -s -X PATCH http://localhost:8080/api/days/today/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"done": true}'

# Edit text
curl -s -X PATCH http://localhost:8080/api/days/today/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"text": "Updated text"}'

# Set priority (if slot 2 is taken, that task gets demoted to priority 0)
curl -s -X PATCH http://localhost:8080/api/days/today/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"priority": 2}'

# Unset priority
curl -s -X PATCH http://localhost:8080/api/days/today/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"priority": 0}'
```

Response: `200 OK` + updated `Task`.

---

### DELETE /api/days/today/tasks/{id}
```bash
curl -s -X DELETE http://localhost:8080/api/days/today/tasks/<id>
```

Response: `204 No Content`. `404` if task not found.

---

### POST /api/days/today/pull/{date}/{taskId}
Copy a specific task from a past day into today. Does NOT modify the source day.

```bash
curl -s -X POST http://localhost:8080/api/days/today/pull/2026-05-14/<task-id>
```

Response: `201 Created` + the new `Task` (with `carriedFrom` set to the source date).

---

## 6. Integration test scenarios (ordered)

Run these in sequence — each builds on prior state.

| # | Action | Expected |
|---|---|---|
| 1 | `GET /api/days/today` on empty DB | 200, empty `tasks[]`, `shouldPromptCarryForward: false` |
| 2 | `POST /api/days/today/tasks` `{text: "Task A"}` | 201, task with `priority: 0`, `done: false` |
| 3 | `POST /api/days/today/tasks` `{text: "Task B", priority: 1}` | 201, task with `priority: 1` |
| 4 | `POST /api/days/today/tasks` `{text: "Task C", priority: 1}` | 201, Task C gets `priority: 1`, Task B demoted to `priority: 0` |
| 5 | `PATCH` Task A with `{done: true}` | 200, `done: true`, `completedAt` is set |
| 6 | `PATCH` Task A with `{done: false}` | 200, `done: false`, `completedAt: null` |
| 7 | `GET /api/days` | 200, array with one entry, `taskCount: 3`, `completedCount: 0` |
| 8 | `DELETE` Task A | 204 |
| 9 | `GET /api/days/today` | 200, only Task B and Task C in `tasks[]` |
| 10 | `GET /api/days/2099-01-01` (nonexistent) | 404, `ErrorResponse` with message |
| 11 | `POST /api/days/today/tasks` with missing `text` | 400, `ErrorResponse` with validation message |
| 12 | `POST /api/days/today/carry-forward` `{taskIds: []}` | 204, sets `carryForwardPrompted: true` on today |
| 13 | `GET /api/days/today` | `shouldPromptCarryForward: false` now (already prompted) |

---

## 7. Priority slot invariant (critical to verify)

At any point, there must be **at most one task** at each of priority 1, 2, and 3 within today's tasks. Verify after any PATCH that sets a priority:

```bash
# Get today's tasks and check for duplicate priorities
curl -s http://localhost:8080/api/days/today | jq '[.day.tasks[] | select(.priority > 0)] | group_by(.priority) | map(select(length > 1))'
# Expected: []
```

---

## 8. TTL note

The `expiresAt` field is set to `date + 7 days at midnight UTC`. MongoDB's TTL background job runs roughly every 60 seconds — documents are not deleted at the exact instant `expiresAt` passes. Do not rely on exact TTL timing in tests.
