const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadConfig() {
  return {
    port: Number(process.env.ORCHESTRATOR_PORT || 3000),
    paymentUrl: readRequiredEnv('PAYMENT_URL'),
    inventoryUrl: readRequiredEnv('INVENTORY_URL'),
    shippingUrl: readRequiredEnv('SHIPPING_URL'),
    notificationUrl: readRequiredEnv('NOTIFICATION_URL'),
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 2500)
  };
}

const config = loadConfig();

const DATA_DIR = '/data';
const IDEMPOTENCY_STORE_PATH = path.join(DATA_DIR, 'idempotency-store.json');
const SAGA_STORE_PATH = path.join(DATA_DIR, 'saga-store.json');

function ensureJsonFile(filePath, initialData) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readJsonFile(filePath) {
  ensureJsonFile(filePath, {});
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw || '{}');
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function payloadHash(payload) {
  const normalized = JSON.stringify(payload);
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return `sha256:${hash}`;
}

function validateCheckoutPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body must be a JSON object';
  }
  if (typeof payload.orderId !== 'string' || payload.orderId.trim() === '') {
    return 'Field "orderId" is required and must be a non-empty string';
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return 'Field "items" is required and must be a non-empty array';
  }
  if (typeof payload.amount !== 'number') {
    return 'Field "amount" is required and must be numeric';
  }
  if (typeof payload.recipient !== 'string' || payload.recipient.trim() === '') {
    return 'Field "recipient" is required and must be a non-empty string';
  }
  return null;
}

function bootstrapStores() {
  ensureJsonFile(IDEMPOTENCY_STORE_PATH, { records: {} });
  ensureJsonFile(SAGA_STORE_PATH, { sagas: {} });
}

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/debug/trace/:orderId', (req, res) => {
  const sagaStore = readJsonFile(SAGA_STORE_PATH);
  const saga = sagaStore?.sagas?.[req.params.orderId];
  if (!saga) {
    res.status(404).json({ code: 'not_found', message: 'No saga found for this orderId' });
    return;
  }
  res.status(200).json(saga);
});

app.post('/checkout', (req, res) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) {
    res.status(400).json({
      code: 'validation_error',
      message: 'Idempotency-Key header is required'
    });
    return;
  }

  const validationError = validateCheckoutPayload(req.body);
  if (validationError) {
    res.status(400).json({
      code: 'validation_error',
      message: validationError
    });
    return;
  }

  const requestHash = payloadHash(req.body);
  const idempotencyStore = readJsonFile(IDEMPOTENCY_STORE_PATH);
  if (!idempotencyStore.records) {
    idempotencyStore.records = {};
  }

  const existing = idempotencyStore.records[idempotencyKey];
  if (existing) {
    if (existing.requestHash !== requestHash) {
      res.status(409).json({
        code: 'idempotency_payload_mismatch',
        message: 'This Idempotency-Key is already used for a different payload'
      });
      return;
    }

    // Starter behavior for in-progress/previous same-key requests is intentionally minimal.
    // Students must implement full replay/conflict strategy and document it in README.
    res.status(409).json({
      code: 'idempotency_conflict',
      message: 'Starter scaffold does not implement duplicate replay handling yet'
    });
    return;
  }

  const orderId = req.body.orderId;
  idempotencyStore.records[idempotencyKey] = {
    requestHash,
    state: 'in_progress',
    httpStatus: 202,
    response: {
      orderId,
      status: 'in_progress'
    },
    updatedAt: nowIso()
  };
  writeJsonFile(IDEMPOTENCY_STORE_PATH, idempotencyStore);

  // --------------------------------------------------------------------------
  // TODO (student): Implement full orchestration flow:
  //   1) payment authorize
  //   2) inventory reserve
  //   3) shipping create
  //   4) notification send
  // with strict sequencing, trace recording, timeout handling, compensation,
  // idempotent replay policy, and restart-safe persistence updates.
  // --------------------------------------------------------------------------

  const scaffoldResponse = {
    orderId,
    status: 'failed',
    code: 'not_implemented',
    message: 'Implement orchestration logic in orchestrator/server.js',
    trace: []
  };

  const sagaStore = readJsonFile(SAGA_STORE_PATH);
  if (!sagaStore.sagas) {
    sagaStore.sagas = {};
  }
  sagaStore.sagas[orderId] = {
    idempotencyKey,
    state: 'failed',
    steps: [],
    updatedAt: nowIso()
  };
  writeJsonFile(SAGA_STORE_PATH, sagaStore);

  idempotencyStore.records[idempotencyKey] = {
    requestHash,
    state: 'failed',
    httpStatus: 422,
    response: scaffoldResponse,
    updatedAt: nowIso()
  };
  writeJsonFile(IDEMPOTENCY_STORE_PATH, idempotencyStore);

  res.status(422).json(scaffoldResponse);
});

bootstrapStores();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[orchestrator] listening on port ${config.port}`);
  console.log('[orchestrator] downstream targets loaded from env', {
    paymentUrl: config.paymentUrl,
    inventoryUrl: config.inventoryUrl,
    shippingUrl: config.shippingUrl,
    notificationUrl: config.notificationUrl,
    requestTimeoutMs: config.requestTimeoutMs
  });
});

