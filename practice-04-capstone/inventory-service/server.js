/**
 * Inventory Service
 * * IMPLEMENTATION COMPLETED
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());


// Configuration — loaded from environment

const PORT = process.env.PORT || 3003;

// Controls whether inventory reservations succeed
const INVENTORY_FAIL_MODE = process.env.INVENTORY_FAIL_MODE || 'never';


// In-memory call log (used by /admin/logs)

const callLog = [];


// Health check — provided, do not change

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service' });
});


// POST /inventory/reserve

app.post('/inventory/reserve', (req, res) => {
  // 1. Извлекаем correlationId из тела или X-Correlation-Id header (EIP: Correlation Identifier)
  const correlationId = req.body.correlationId || req.get('X-Correlation-Id');
  const { orderId } = req.body;

  // 2. Логируем вызов для административного интерфейса (grading)
  callLog.push({
    endpoint: '/inventory/reserve',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  // 3. Логика определения успеха/ошибки (Failure Scenarios)
  let shouldFail = false;
  if (INVENTORY_FAIL_MODE === 'always') {
    shouldFail = true;
  } else if (INVENTORY_FAIL_MODE === 'random') {
    shouldFail = Math.random() < 0.1; // 10% шанс отказа
  }

  // 4. Обработка результата
  if (shouldFail) {
    console.log(`[inventory-service] UNAVAILABLE: Order ${orderId} | Mode: ${INVENTORY_FAIL_MODE}`);
    return res.status(422).json({ 
      status: "unavailable", 
      reason: "Insufficient stock", 
      correlationId 
    });
  }

  // 5. Успешный ответ
  console.log(`[inventory-service] RESERVED: Order ${orderId}`);
  res.status(200).json({ 
    status: "reserved", 
    reservationId: uuidv4(), 
    correlationId 
  });
});


// POST /inventory/release

app.post('/inventory/release', (req, res) => {
  // 1. Извлекаем correlationId
  const correlationId = req.body.correlationId || req.get('X-Correlation-Id');
  const { orderId } = req.body;

  // 2. Логируем вызов (важно для проверки логики компенсации)
  callLog.push({
    endpoint: '/inventory/release',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  console.log(`[inventory-service] RELEASED: Order ${orderId} | Correlation: ${correlationId}`);

  // 3. Возврат стока всегда успешен
  res.status(200).json({ 
    status: "released", 
    correlationId 
  });
});


// Admin endpoints — do not remove


app.get('/admin/logs', (req, res) => {
  res.json(callLog);
});

app.post('/admin/reset', (req, res) => {
  callLog.length = 0;
  console.log('[inventory-service] Call log cleared');
  res.json({ status: 'ok', message: 'Call log cleared' });
});

app.listen(PORT, () => {
  console.log(`[inventory-service] Running on port ${PORT} | INVENTORY_FAIL_MODE=${INVENTORY_FAIL_MODE}`);
});