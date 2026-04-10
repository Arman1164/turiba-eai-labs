/**
 * Payment Service
 * * IMPLEMENTATION COMPLETED
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());


// Configuration — loaded from environment

const PORT = process.env.PORT || 3002;

// Controls whether payments succeed or fail
const PAYMENT_FAIL_MODE = process.env.PAYMENT_FAIL_MODE || 'never';


// In-memory call log (used by /admin/logs)

const callLog = [];


// Health check — provided, do not change

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});


// POST /payment/authorize

app.post('/payment/authorize', (req, res) => {
  // 1. Извлекаем correlationId из тела или заголовка (EIP: Correlation Identifier)
  const correlationId = req.body.correlationId || req.get('X-Correlation-Id');
  const { orderId } = req.body;

  // 2. Логируем вызов для административного интерфейса
  callLog.push({
    endpoint: '/payment/authorize',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  // 3. Логика определения успеха/ошибки (Failure Scenarios)
  let shouldFail = false;
  if (PAYMENT_FAIL_MODE === 'always') {
    shouldFail = true;
  } else if (PAYMENT_FAIL_MODE === 'random') {
    shouldFail = Math.random() < 0.2;
  }

  // 4. Обработка результата
  if (shouldFail) {
    console.log(`[payment-service] REJECTED: Order ${orderId} | Mode: ${PAYMENT_FAIL_MODE}`);
    return res.status(422).json({ 
      status: "rejected", 
      reason: "Payment declined", 
      correlationId 
    });
  }

  // 5. Успешный ответ
  console.log(`[payment-service] AUTHORIZED: Order ${orderId}`);
  res.status(200).json({ 
    status: "authorized", 
    transactionId: uuidv4(), 
    correlationId 
  });
});


// POST /payment/refund

app.post('/payment/refund', (req, res) => {
  // 1. Извлекаем correlationId
  const correlationId = req.body.correlationId || req.get('X-Correlation-Id');
  const { orderId } = req.body;

  // 2. Логируем вызов (важно для проверки компенсации)
  callLog.push({
    endpoint: '/payment/refund',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  console.log(`[payment-service] REFUNDED: Order ${orderId} | Correlation: ${correlationId}`);

  // 3. Возврат всегда успешен в рамках данного задания
  res.status(200).json({ 
    status: "refunded", 
    correlationId 
  });
});


// Admin endpoints — do not remove


app.get('/admin/logs', (req, res) => {
  res.json(callLog);
});

app.post('/admin/reset', (req, res) => {
  callLog.length = 0;
  console.log('[payment-service] Call log cleared');
  res.json({ status: 'ok', message: 'Call log cleared' });
});

app.listen(PORT, () => {
  console.log(`[payment-service] Running on port ${PORT} | PAYMENT_FAIL_MODE=${PAYMENT_FAIL_MODE}`);
});