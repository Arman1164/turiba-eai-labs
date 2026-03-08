# Practice 3: API Orchestration & Service Composition

**Course:** Enterprise Application Integration (EAI)  
**Total points:** 30 (26 automated + 2 bonus + 2 manual review)

---

## 1) Objective

Implement a Node.js orchestration service that exposes `POST /checkout` and performs a business transaction across downstream APIs in strict order:

1. payment authorize
2. inventory reserve
3. shipping create
4. notification send

Your service must support compensation, timeout control, idempotency, and restart-safe file persistence.

---

## 2) What is provided

This starter includes:

- Dockerized orchestrator and 4 mock services
- Public grading-oriented tests and scenarios
- JSON schemas for response and persistence contracts
- CI auto-grade workflow and report generator

The orchestrator scaffold is intentionally incomplete. You must implement core orchestration logic.

---

## 3) Prerequisites

- Docker Desktop with Compose support
- Node.js 18+
- Available ports: `3000`, `4001`, `4002`, `4003`, `4004`

---

## 4) Run locally

```bash
docker-compose up --build
```

Or detached:

```bash
docker-compose up -d --build
```

Health checks:

```bash
curl http://localhost:3000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
```

Stop:

```bash
docker-compose down
```

Remove volumes:

```bash
docker-compose down -v
```

### Run provided tests locally

From the repository root, install test dependencies and run the public grading suite:

```bash
cd test
npm install
npx jest orchestration.public.test.js --runInBand --forceExit --json --outputFile=results.json
```

Optional full test run from `test/`:

```bash
npm test
```

Generate a local grade report from the root folder:

```bash
cd ..
node grading/report.js test/results.json
```

Interpretation:

- Passing public tests means your implementation matches the visible baseline contract.
- Hidden anti-gaming checks still run in CI, so public pass is necessary but not sufficient for full score.
- The generated `grade-report.md` summarizes deterministic points, bonus points, and manual-review placeholder.

---

## 5) Required orchestrator endpoints

1. `GET /health` → `200 { "status": "ok" }`
2. `POST /checkout` (graded)
3. Optional `GET /debug/trace/:orderId`

### Required header

`Idempotency-Key` is mandatory for `POST /checkout`.

---

## 6) Required response contract (core fields)

```json
{
  "orderId": "ord-123",
  "status": "completed",
  "trace": [
    {
      "step": "payment",
      "status": "success",
      "startedAt": "2026-03-01T10:00:00.000Z",
      "finishedAt": "2026-03-01T10:00:00.120Z",
      "durationMs": 120
    }
  ]
}
```

Trace must preserve real execution order and include all required fields.

---

## 7) Deterministic behavior rules

Mandatory HTTP mapping:

- `completed` → `200`
- business failure / compensation failure → `422`
- timeout-triggered flow → `504`

Mandatory machine codes where applicable:

- `timeout`
- `idempotency_conflict`
- `compensation_failed`
- `idempotency_payload_mismatch`

---

## 8) Idempotency rules

1. Same key + same payload: replay prior result (or deterministic in-progress policy)
2. Same key + different payload: must return `409` + `idempotency_payload_mismatch`
3. Records must survive orchestrator container restart

Persistence files (inside container):

- `/data/idempotency-store.json`
- `/data/saga-store.json`

---

## 9) Downstream URLs and environment

Orchestrator must use environment variables:

- `ORCHESTRATOR_PORT`
- `PAYMENT_URL`
- `INVENTORY_URL`
- `SHIPPING_URL`
- `NOTIFICATION_URL`

Hardcoding downstream URLs is penalized.

---

## 10) Public grading criteria (automated 26 pts)

1. Services start and health checks pass
2. Happy path sequence and completed result
3. Payment fail short-circuits downstream
4. Inventory fail triggers refund compensation
5. Shipping timeout triggers compensation
6. Compensation failure mapping (`422` + `compensation_failed`)
7. Idempotency replay (same key + same payload)
8. Idempotency mismatch (`409`)
9. Strict trace fields and order

Bonus (2 pts): probabilistic stress checks; cannot reduce score.

Manual review (2 pts): architecture rationale and README quality.

---

## 11) Optional debug UI

An ungraded debug shell is available at `/debug.html`. You may improve it for your own diagnostics.

---

## 12) Submission checklist

- [ ] `POST /checkout` fully implemented with strict sequence
- [ ] Compensation implemented for required failure paths
- [ ] Timeout handling implemented
- [ ] Idempotency contract fully implemented
- [ ] File persistence survives restart
- [ ] Trace order and schema are correct
- [ ] README architecture rationale section completed
- [ ] AI-usage note added (if applicable) with what you changed/understood

