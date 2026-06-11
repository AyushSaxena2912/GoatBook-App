const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Root health check (Render heartbeat) - AT THE VERY TOP TO BYPASS MIDDLEWARE
app.get('/', (req, res) => {
  console.log(`[HEALTH] Heartbeat requested by ${req.ip}`);
  res.status(200).send('GoatBook API Running');
});
const prisma = require('./config/prisma');
const { setupNotificationWorker } = require('./utils/notificationWorker');

// Middleware
app.use(cors()); // Allow all origins for connectivity diagnostics
app.use(express.json());

// Verbose Request logger for diagnostics
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[NET] ${timestamp} ${req.method} ${req.url}`);
  console.log(`[HEADERS] ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`[IP] ${req.ip} | [PROTOCOL] ${req.protocol}`);
  next();
});


// Diagnostic route for DB - MOVED TO TOP FOR RECOVERY
app.get('/api/test-db', async (req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    res.json({ status: 'connected', duration: `${duration}ms` });
  } catch (err) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/breeds', require('./routes/breeds'));
app.use('/api/animals', require('./routes/animals'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/weights', require('./routes/weights'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/vaccines', require('./routes/vaccines'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/matings', require('./routes/matings'));
app.use('/api/breedings', require('./routes/breedings'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5001; // Avoid port 5000 conflict with macOS AirPlay

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT} at 0.0.0.0`);
  
  // SELF-PING HACK: Keep server awake
  // Checks PUBLIC_URL env var, or falls back to Render for safety during transition
  const PUBLIC_URL = process.env.PUBLIC_URL || 'https://goatbookapp-production.up.railway.app/';
  const https = require('https');
  
  setInterval(() => {
    https.get(PUBLIC_URL, (res) => {
      console.log(`[SELF-PING] Status: ${res.statusCode} | Target: ${PUBLIC_URL}`);
    }).on('error', (err) => {
      console.error(`[SELF-PING] Error: ${err.message}`);
    });
  }, 300000); // 5 minutes
  
  // WORKER DISABLED TEMPORARILY FOR EMERGENCY RECOVERY
  // setupNotificationWorker();
});
