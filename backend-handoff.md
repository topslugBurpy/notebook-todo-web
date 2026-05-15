# Backend Handoff — Integration Testing Prerequisites

**Revised against `backend-signoff.md` on 2026-05-15.**
All endpoints at `http://localhost:8080`. Vite proxies `/api/*` → `http://localhost:8080/api/*`.

---

## 0. Starting the backend

```bash
# From backend project root
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Requires Java 21+ and MongoDB on `localhost:27017` (no auth). Ready when the console prints:
```
Started NotebookTodoApplication in X.XXX seconds
```

To wipe state for a clean test run:
```bash
mongosh mongodb://localhost:27017/notebooktodo-dev --eval "db.days.drop()"
```

---

## 1. Endpoints

### GET /api/days/today
Creates today's day document if it doesn't exist yet. Always returns 200.

Expected shape:
```jsonc
{
  "day": {
    "id": "mongo-object-id",
    "date": "2026-05-15",
    "dayOfWeek": "Thursday",
    "tasks": [
      {
        "id": "uuid-string",
        "text": "Buy groceries",
        "done": false,
        "priority": 0,         // 0 = no slot, 1/2/3 = exclusive priority slots
        "createdAt": "2026-05-15T10:00:00Z",
        "completedAt": null,
        "carriedFrom": null
      }
    ],
    "carryForwardPrompted": false,
    "expiresAt": "2026-05-22T00:00:00Z"
  },
  "shouldPromptCarryForward": true,
  "yesterdayUnfinishedTasks": [ /* Task[] — only done: false tasks from yesterday */ ]
}
```

Rules:
- `shouldPromptCarryForward` is `true` only when yesterday has ≥ 1 `done: false` task **AND** `carryForwardPrompted` is `false`
- `yesterdayUnfinishedTasks` must be the field name — not `yesterdayUnfinished`
- Once carry-forward is posted (even with empty `taskIds`), `carryForwardPrompted` flips to `true` and `shouldPromptCarryForward` becomes `false` permanently for that day

---

### GET /api/days
Sidebar feed — last 7 days, newest first. No embedded tasks.

```jsonc
[
  {
    "date": "2026-05-15",
    "dayOfWeek": "Thursday",
    "taskCount": 5,
    "completedCount": 2
  }
]
```

- `completedCount` must stay accurate after every mutation (add, toggle, delete, carry-forward)

---

### GET /api/days/:date
Full day document for a past date. Returns `404` (not `500`) if no document exists for that date.

---

### POST /api/days/today/tasks
```jsonc
// Request
{ "text": "Critical task", "priority": 1 }  // priority defaults to 0 if omitted

// Response — 201 Created
{ "id": "uuid", "text": "Critical task", "done": false, "priority": 1, ... }
```

**Priority slot invariant:** at most one task per slot (1, 2, 3) within a day. If the requested slot is already taken, the existing occupant is demoted to `priority: 0`. The frontend relies on a refetch after mutation to pick up the demotion — the response only needs to return the new task correctly.

---

### PATCH /api/days/today/tasks/:id
Partial update — only send fields that change.

```jsonc
// Mark done
{ "done": true }   // sets completedAt to current UTC timestamp

// Unmark done
{ "done": false }  // clears completedAt to null

// Edit text
{ "text": "Updated text" }

// Set priority slot (triggers demotion of current occupant if slot is taken)
{ "priority": 2 }

// Unset priority
{ "priority": 0 }
```

Response: `200 OK` + full updated `Task`. Returns `404` for unknown task id.

---

### DELETE /api/days/today/tasks/:id
Response: `204 No Content`. Returns `404` for unknown task id.

---

### POST /api/days/today/carry-forward
**Must accept an empty `taskIds` array** — this is how the frontend signals "Skip" (dismiss without carrying). The backend must set `carryForwardPrompted: true` on today's document in both cases.

```jsonc
// Carry selected tasks
{ "taskIds": ["uuid-1", "uuid-2"] }

// Dismiss without carrying (Skip button)
{ "taskIds": [] }
```

Response: `204 No Content`. Idempotent — carrying the same task twice must not create duplicates. Carried tasks appear in today with `carriedFrom` set to yesterday's date.

---

### POST /api/days/today/pull/:date/:taskId
Copies a single task from any past day into today. Does not modify the source day.
Response: `201 Created` + new `Task` with `carriedFrom` set to `:date`.

---

## 2. Data contracts

| Field | Expected type | Notes |
|---|---|---|
| `Task.id` | `string` (UUID) | Never an integer |
| `Task.priority` | `0 \| 1 \| 2 \| 3` | `0` = no slot. Never `null`, never a string |
| `Task.completedAt` | ISO-8601 timestamp or `null` | Set when `done` flips to `true`, cleared when flipped back |
| `Task.carriedFrom` | `"YYYY-MM-DD"` or `null` | Set for tasks created via carry-forward or pull |
| `Day.date` | `"YYYY-MM-DD"` | No timestamps, no locale strings |
| `DayFeedItem.date` | `"YYYY-MM-DD"` | Same |
| `TodayResponse.yesterdayUnfinishedTasks` | `Task[]` | Exact field name — frontend reads this key |

---

## 3. CORS

- Allowed origin: `http://localhost:5173`
- Allowed methods: `GET, POST, PATCH, DELETE, OPTIONS`
- Allowed headers: `Content-Type`
- Preflight `OPTIONS` must return `200`

To change the origin at startup:
```bash
CORS_ORIGIN=http://localhost:3000 ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 4. Error shape

All 4xx/5xx must return:
```jsonc
{
  "status": 404,
  "error": "Not Found",
  "message": "Day not found: 2026-01-01",
  "timestamp": "2026-05-15T10:00:00Z"
}
```

---

## 5. Seed data scenarios

The dev profile must produce (via seed script or `--seed` flag — not manual inserts):

| Scenario | Requirement |
|---|---|
| Carry-forward prompt shows | Yesterday has ≥ 1 `done: false` task, `carryForwardPrompted: false` |
| Carry-forward prompt suppressed | A day where `carryForwardPrompted: true` — prompt must not re-show |
| Priority slot display | Today has one task each at `priority` 1, 2, 3 |
| Priority demotion | Two tasks competing for the same slot — verify only one holds it |
| Sidebar feed | ≥ 5 past days with varying `taskCount` / `completedCount` |
| Empty day | One date with `tasks: []` — tests the empty state UI |
| Carried task | One task with `carriedFrom` set — tests the label rendering |

---

## 6. Smoke-test sequence

Run in order — each step builds on prior state.

```bash
BASE=http://localhost:8080/api

# 1. Fetch today (creates document if absent)
curl -s $BASE/days/today | jq '{date: .day.date, taskCount: (.day.tasks | length), shouldPrompt: .shouldPromptCarryForward}'

# 2. Add a task with no priority
curl -s -X POST $BASE/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"text":"Smoke test task"}' | jq '{id, priority}'
# Expect: priority = 0

# 3. Add a priority-1 task — save the id
P1_ID=$(curl -s -X POST $BASE/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"text":"Priority one task","priority":1}' | jq -r '.id')

# 4. Add another priority-1 task — the previous one must be demoted
curl -s -X POST $BASE/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"text":"Priority one again","priority":1}' | jq '{id, priority}'
# Verify demotion:
curl -s $BASE/days/today | jq '[.day.tasks[] | select(.priority > 0)] | group_by(.priority) | map(select(length > 1))'
# Expect: []  (no duplicate slots)

# 5. Mark P1_ID done
curl -s -X PATCH $BASE/days/today/tasks/$P1_ID \
  -H "Content-Type: application/json" \
  -d '{"done":true}' | jq '{done, completedAt}'
# Expect: done=true, completedAt is set

# 6. Sidebar — completedCount should reflect the above
curl -s $BASE/days | jq '.[0] | {date, taskCount, completedCount}'

# 7. Dismiss carry-forward (Skip)
curl -s -X POST $BASE/days/today/carry-forward \
  -H "Content-Type: application/json" \
  -d '{"taskIds":[]}' -w "\nHTTP %{http_code}\n"
# Expect: HTTP 204

# 8. shouldPromptCarryForward must now be false
curl -s $BASE/days/today | jq '.shouldPromptCarryForward'
# Expect: false

# 9. Nonexistent date → 404
curl -s $BASE/days/2099-01-01 -w "\nHTTP %{http_code}\n" | tail -1
# Expect: HTTP 404

# 10. Missing text → 400
curl -s -X POST $BASE/days/today/tasks \
  -H "Content-Type: application/json" \
  -d '{"priority":1}' -w "\nHTTP %{http_code}\n" | tail -1
# Expect: HTTP 400
```

All steps must pass with no 5xx responses before handing off to integration testing.

---

## 7. TTL note

`expiresAt` is set to `date + 7 days at midnight UTC`. MongoDB's TTL worker runs approximately every 60 seconds — do not rely on exact expiry timing in tests.
