const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = require('./config/prisma');

// Test DB Connection on startup
prisma.$connect()
  .then(() => console.log('Prisma: Connected to PostgreSQL successfully.'))
  .catch(err => console.error('Prisma: Connection failed:', err.message));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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

// Basic route for testing
app.get('/', (req, res) => res.send('GoatBook API Running'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
