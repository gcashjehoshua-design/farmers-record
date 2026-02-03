// server.js - Main Express server

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');

// Initialize Express
const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins (for development)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
const farmersRoute = require('./routes/farmers');
const transactionsRoute = require('./routes/transactions');

// API Routes
app.use('/api/farmers', farmersRoute);
app.use('/api/transactions', transactionsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route - serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   FARMERS RECORD SYSTEM - Backend Server                   ║
║   Server running on http://localhost:${PORT}                  ║
║   ✓ Database: SQLite                                       ║
║   ✓ API: RESTful                                           ║
║   ✓ Frontend: Served at root                               ║
╚════════════════════════════════════════════════════════════╝

API Endpoints:
  GET  /api/farmers              - Get all farmers
  POST /api/farmers              - Create new farmer
  GET  /api/farmers/:id          - Get farmer details
  PUT  /api/farmers/:id          - Update farmer
  GET  /api/farmers/search/:q    - Search farmers

  GET  /api/transactions/types   - Get transaction types
  POST /api/transactions         - Record transaction
  GET  /api/transactions         - Get all transactions
  GET  /api/transactions/:id     - Get single transaction

Frontend:
  http://localhost:${PORT}/

To view in browser, open: http://localhost:${PORT}
`);
});

module.exports = app;
