// Teste do webhook Kiwify
const testWebhook = async () => {
  const webhookData = {
    "order_id": "test-123",
    "order_ref": "TEST",
    "order_status": "paid",
    "webhook_event_type": "order_approved",
    "Product": {
      "product_id": "prod-test",
      "product_name": "Produto Teste"
    },
    "Customer": {
      "full_name": "João Teste",
      "first_name": "João",
      "email": "teste@example.com"
    }
  };

  try {
    const response = await fetch('https://comunidadeiacode.vercel.app/api/webhooks/kiwify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Erro:', error);
  }
};

testWebhook();
