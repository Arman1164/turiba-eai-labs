# Capstone: Orchestrated Enterprise Application Integration System

**Course:** Enterprise Application Integration (EAI)
**Type:** Individual capstone project
**Deadline:** 25.03.2026
**Weight:** Final assessment — most important deliverable of the course

---

## 1. Objective

Design and implement an enterprise-grade integration solution that coordinates multiple independent services using **messaging, Enterprise Integration Patterns (EIP), and process orchestration with Node-RED**.

You are evaluated on:
- **Architectural thinking** — not just making it work
- **Correct pattern application** — patterns must be visibly and correctly used
- **Reliable failure handling** — compensation and error paths must work
- **Documentation quality** — diagrams, justifications, failure analysis

> Working code without correct architecture will not receive a high grade.

---

## 2. Business Scenario

An e-commerce company operates four independent services that must collaborate to process a customer order. The services **do not share a database** and communicate **only via APIs or messages**.

### Participating Systems

| System | Role |
|---|---|
| **Order Service** | Accepts incoming orders, manages order records |
| **Payment Service** | Validates and authorizes payment |
| **Inventory Service** | Reserves and releases stock |
| **Notification Service** | Sends customer and admin notifications |
| **Node-RED** | Integration layer — orchestrates the process and applies EAI patterns |

### Business Process

1. Customer places an order
2. Payment is validated
3. Inventory is reserved (only if payment succeeded)
4. Notification is sent (only if inventory reserved)
5. On any failure → compensate all already-successful steps in reverse order
6. Every message carries a correlation ID so the full order lifecycle is traceable

---

## 3. What Is Provided vs. What You Build

| Component | Status | Your Task |
|---|---|---|
| `notification-service/` | **Pre-built mock** — do not modify | Use it. Call `POST /notification/send`. |
| `payment-service/server.js` | **Partial scaffold** — complete the TODOs | Implement authorize + refund + fail mode logic |
| `inventory-service/server.js` | **Partial scaffold** — complete the TODOs | Implement reserve + release + fail mode logic |
| `order-service/server.js` | **Partial scaffold** — complete the TODOs | Implement order creation + retrieval |
| `flows.json` | **3-tab skeleton** — wire the stubs | Build orchestration, error handling, and admin flows |
| `docker-compose.yml` | **Provided** — extend if needed | Uncomment RabbitMQ section if using it (bonus) |
| `canonical-schema.json` | **Reference schema** | Use it for message transformation |
| `test-data/` | **Sample orders** | Use for testing your integration |

---

## 4. Architecture Decision: Entry Point

You must choose one of two architectural approaches and document your choice:

### Option A — Node-RED is the entry point
```
Client → POST /order (Node-RED HTTP-in) → Node-RED calls Order Service to record
         → Payment → Inventory → Notification → Response
```

### Option B — Order Service is the entry point
```
Client → POST /orders (Order Service) → Order Service triggers Node-RED
         → Node-RED orchestrates Payment → Inventory → Notification → Response
```

Both are architecturally valid. **Document your decision in your architecture diagram** and justify it in your README (1 paragraph).

---

## 5. Service API Contracts

### Order Service (you build)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check → `{ status: "ok" }` |
| `POST` | `/orders` | Create order → `{ orderId, correlationId, status: "received" }` |
| `GET` | `/orders/:id` | Retrieve order by ID |

### Payment Service (you build)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/payment/authorize` | Authorize payment → `{ status: "authorized"\|"rejected", transactionId, correlationId }` |
| `POST` | `/payment/refund` | Refund payment → `{ status: "refunded", correlationId }` |

### Inventory Service (you build)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/inventory/reserve` | Reserve stock → `{ status: "reserved"\|"unavailable", reservationId, correlationId }` |
| `POST` | `/inventory/release` | Release reservation → `{ status: "released", correlationId }` |

### Notification Service (pre-built — do not modify)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/notification/send` | Log notification → `{ status: "sent" }` |

### Node-RED Integration Layer (you build)

Your Node-RED flow must expose **at minimum**:

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check (already wired in Admin tab) |
| Entry point | your choice | Main order intake endpoint |

**Required response format** from the orchestration endpoint:
```json
{
  "orderId": "WEB-2024-001",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed | failed | compensated",
  "trace": [
    { "step": "payment", "status": "success", "durationMs": 120 },
    { "step": "inventory", "status": "success", "durationMs": 85 },
    { "step": "notification", "status": "success", "durationMs": 45 }
  ]
}
```

Compensation steps must appear in the trace:
```json
{ "step": "compensation:payment-refund", "status": "success" }
```

---

## 6. Required EIP Patterns

You must implement **at least 4 named EIP patterns** from **at least 3 of the 4 pattern categories**. Each pattern must be:
- Named correctly
- Visibly and correctly implemented
- Explained in your Pattern Mapping Table

### Required Categories

| Category | Required | Suggested patterns |
|---|---|---|
| Routing & Flow | **YES** | Content-Based Router, Recipient List |
| Reliability | **YES** | Dead Letter Channel, Idempotent Receiver |
| Coordination | **YES** | Correlation Identifier, Request-Reply |
| Transformation & Data | Bonus | Message Translator, Canonical Data Model |

### Pattern Mapping Table (required in your README)

Add this table to your README and fill it in:

| Pattern | Problem It Solves | Where Applied | Why Chosen |
|---|---|---|---|
| Content-Based Router | | | |
| Correlation Identifier | | | |
| Dead Letter Channel | | | |
| *(4th pattern — your choice)* | | | |

---

## 7. Required Failure Scenarios

You must implement and **demonstrate** at least 2 failure scenarios:

### Scenario 1 — Payment Rejection
- Set `PAYMENT_FAIL_MODE=always` in `docker-compose.yml`, restart payment-service
- Send an order
- **Expected behavior:** flow returns `status: "failed"`, inventory and notification are NOT called

### Scenario 2 — Inventory Unavailable (triggers compensation)
- Set `INVENTORY_FAIL_MODE=always` in `docker-compose.yml`, restart inventory-service
- Send an order where payment succeeded
- **Expected behavior:** payment refund is called (compensation), flow returns `status: "compensated"`

### Compensation Rules
- Compensation must run in **reverse order** of completed steps
- If inventory fails after payment succeeded → refund payment
- If notification fails after inventory succeeded → release inventory, then refund payment
- Compensation steps must appear in the response `trace` array

---

## 8. How to Run

### Prerequisites
- Docker Desktop installed and running
- Git

### Start the system

```bash
# 1. Clone your repo and enter it
git clone <your-repo-url>
cd practice-04-capstone

# 2. Copy port configuration
cp .env.example .env

# 3. Build and start all services
docker compose up -d --build

# 4. Wait ~25 seconds for all services to initialize

# 5. Verify everything is running
curl http://localhost:1880/health     # Node-RED
curl http://localhost:3001/health     # Order Service
curl http://localhost:3002/health     # Payment Service
curl http://localhost:3003/health     # Inventory Service
curl http://localhost:3004/health     # Notification Service
```

### Open Node-RED
```
http://localhost:1880
```

Inside Node-RED, use Docker **service names** (not localhost) to call other services:
- `http://order-service:3001`
- `http://payment-service:3002`
- `http://inventory-service:3003`
- `http://notification-service:3004`

### Send test orders

```bash
# Standard order (web store format)
curl -s -X POST http://localhost:1880/order \
  -H "Content-Type: application/json" \
  -d @test-data/web-order.json

# Express order (mobile app format — flat JSON, abbreviated fields)
curl -s -X POST http://localhost:1880/order \
  -H "Content-Type: application/json" \
  -d @test-data/mobile-order.json

# B2B order (XML/EDI format)
curl -s -X POST http://localhost:1880/order \
  -H "Content-Type: text/xml" \
  -d @test-data/b2b-order.xml
```

### Test compensation

```bash
# Step 1: Make payment always fail
# Edit docker-compose.yml: change PAYMENT_FAIL_MODE to 'always'
docker compose up -d payment-service

# Step 2: Send order
curl -s -X POST http://localhost:1880/order \
  -H "Content-Type: application/json" \
  -d @test-data/web-order.json

# Step 3: Verify inventory was NOT called
curl http://localhost:3003/admin/logs   # should be empty

# Step 4: Restore
# Edit docker-compose.yml: change PAYMENT_FAIL_MODE back to 'never'
docker compose up -d payment-service
```

### Stop the system

```bash
docker compose down

# To also clear all data volumes:
docker compose down -v
```

---

## 9. Deliverables Checklist

Your submitted GitHub repository must include all of the following:

### Code
- [ ] `order-service/server.js` — fully implemented (TODOs replaced)
- [ ] `payment-service/server.js` — fully implemented (TODOs replaced)
- [ ] `inventory-service/server.js` — fully implemented (TODOs replaced)
- [ ] `flows.json` — Node-RED flow with Orchestration, Error Handling, and Admin tabs wired

### Architecture Documentation (in `docs/` or inline in README as Mermaid)
- [ ] **System Context Diagram** — all services, integration layer, client, labeled arrows
- [ ] **Integration Architecture Diagram** — message flows, protocols, error paths, DLQ
- [ ] **Orchestration Flow** — BPMN or sequence diagram with success + compensation paths

### README Sections
- [ ] **Architecture decision** — which entry point you chose and why (1 paragraph)
- [ ] **Pattern Mapping Table** — ≥4 patterns with name/problem/where/why
- [ ] **Failure Analysis** — for ≥2 scenarios: what fails, system reaction, final state
- [ ] **AI usage disclosure** — state whether AI tools were used; if so, describe what you understood and changed

---

## 10. Grading

Your submission is evaluated by the instructor using [GRADING.md](GRADING.md) with Claude Code.

| Section | Points |
|---|---:|
| Infrastructure (services boot, Node-RED loads) | 10 |
| Architecture Diagrams (3 required diagrams) | 20 |
| EIP Pattern Application (pattern table + CBR + correlation + DLC) | 25 |
| Compensation & Business Logic (happy path + 2 failure scenarios) | 25 |
| Architecture Integrity (no shared DB, no direct coupling) | 10 |
| Code & Documentation Quality (config, env vars, AI disclosure) | 10 |
| **Total** | **100** |
| **Bonus: RabbitMQ Integration** | **+15** |

---

## 11. Common Mistakes to Avoid

| Mistake | Why it costs you points |
|---|---|
| Implementing all orchestration in a single Function node | Violates Pipes & Filters; CBR criterion → 0 pts |
| Claiming a pattern name but not implementing it correctly | Pattern Mapping Table criterion → 0 pts for that pattern |
| Business services calling each other directly | Architecture Integrity criterion → 0 pts |
| `correlationId` generated fresh in each service | Correlation Identifier criterion → 0 pts |
| Compensation called in wrong order (refund before release) | Compensation criterion → partial pts |
| Hardcoded `http://localhost:3002` in service code | Config quality criterion → 0 pts |
| Returning `status: "compensated"` when compensation failed silently | Criterion 4.4 → 0 pts |
| No error paths in diagrams | Architecture Diagram criteria → half pts |

---

## 12. RabbitMQ Bonus Integration

To earn up to 15 bonus points, integrate RabbitMQ into your architecture:

1. Uncomment the `rabbitmq` service in `docker-compose.yml`
2. Use `amqp-out` / `amqp-in` nodes in Node-RED (pre-installed in `Dockerfile.nodered`)
3. Have at least one service communicate via AMQP instead of HTTP
4. Configure a Dead Letter Queue and demonstrate a message landing in it
5. Use a fanout exchange so at least 2 consumers receive the same event

RabbitMQ Management UI: `http://localhost:15672` (guest / guest)

---

## 13. Reference Materials

- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Node-RED Documentation](https://nodered.org/docs/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [Canonical Order Schema](canonical-schema.json)
- [Diagram format examples](docs/example-diagrams/system-context-example.md)
