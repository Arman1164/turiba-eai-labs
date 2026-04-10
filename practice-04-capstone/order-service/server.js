
// POST /orders

app.post('/orders', (req, res) => {
  // 1. Генерируем ID
  const orderId = "ord-" + uuidv4().substring(0, 8);
  
  // 2. Генерируем Correlation ID (важно для EIP!)
  const correlationId = uuidv4();

  // 3. Создаем объект заказа (согласно Canonical Schema)
  const order = {
    orderId,
    correlationId,
    ...req.body,
    receivedAt: new Date().toISOString(),
    status: 'received'
  };

  // 4. Сохраняем в Map (наша "база данных")
  orders.set(orderId, order);

  console.log(`[order-service] Record created: ${orderId} | Correlation: ${correlationId}`);

  // 5. Возвращаем успешный ответ (Option A: Node-RED сам продолжит цепочку)
  res.status(201).json({ 
    orderId, 
    correlationId, 
    status: 'received' 
  });
});


// GET /orders/:id

app.get('/orders/:id', (req, res) => {
  const orderId = req.params.id;
  
  // 1. Ищем в Map
  const order = orders.get(orderId);

  // 2. Возвращаем результат
  if (order) {
    res.status(200).json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});