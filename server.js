const express = require('express');
const app = express();
app.use(express.json());

// 1. Endpoint que falla por Base de Datos (Simulación de error de permisos/estado)
app.get('/api/v1/healthcare/authorization/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'ERR_DB_01') {
    return res.status(500).json({
      error: 'DatabaseConnectionError',
      code: 'PG_ERR_53300',
      message: 'FATAL: remaining connection slots are reserved for non-replication superuser connections',
      timestamp: new Date().toISOString()
    });
  }
  res.json({ id, status: 'APPROVED', procedure: 'MRI_BRAIN_WITHOUT_CONTRAST' });
});

// 2. Endpoint que falla por integración de 3ro / Timeout (Simulación de Pasarela/Proveedor)
app.post('/api/v1/payments/process', (req, res) => {
  const { transaction_id } = req.body;
  if (transaction_id === 'TX_TIMEOUT_99') {
    return res.status(504).json({
      error: 'GatewayTimeout',
      provider: 'Yalutec_Pay_Gateway',
      message: 'External provider service did not respond within 5000ms threshold',
      timestamp: new Date().toISOString()
    });
  }
  res.json({ transaction_id, status: 'SUCCESS' });
});

// 3. Endpoint simulador para disparar Webhooks a n8n cuando ocurre una falla
app.post('/api/v1/trigger-incident', async (req, res) => {
  const { incident_type, payload } = req.body;
  
  // Aquí simulamos que el sistema detecta un error en logs y envía la alerta a n8n
  console.log(`[ALERT] Triggering Incident to n8n: ${incident_type}`);
  
  // URL de tu Webhook en n8n
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/incident-alert';  
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'INCIDENT_DETECTED',
        incident_type,
        service: 'Osigu_Authorization_Engine',
        environment: 'staging',
        details: payload,
        timestamp: new Date().toISOString()
      })
    });
    res.json({ message: 'Incident sent to n8n workflow successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send to n8n', details: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Incident Simulator API running on http://localhost:${PORT}`));