// routes/transactions.js - API routes for transaction management

const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// Helper: get current date-time in Asia/Manila as 'YYYY-MM-DD HH:MM:SS'
function getManilaNow() {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = dtf.formatToParts(new Date());
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  // en-GB ordering gives day, month, year
  const y = map.year;
  const m = map.month;
  const d = map.day;
  const hh = map.hour;
  const mm = map.minute;
  const ss = map.second;
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// GET all transaction types (for dropdown)
router.get('/types', async (req, res) => {
  try {
    const types = await dbAll(
      'SELECT * FROM transaction_types ORDER BY type_id ASC'
    );

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST record new transaction
router.post('/', async (req, res) => {
  try {
    const { farmer_id, type_id, amount, description, notes, created_by } = req.body;

    // Validation
    if (!farmer_id || !type_id) {
      return res.status(400).json({
        success: false,
        error: 'Farmer ID and Transaction Type are required'
      });
    }

    // Verify farmer exists
    const farmer = await dbGet(
      'SELECT farmer_id FROM farmers WHERE farmer_id = ?',
      [farmer_id]
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }

    // Verify transaction type exists
    const transType = await dbGet(
      'SELECT type_id FROM transaction_types WHERE type_id = ?',
      [type_id]
    );

    if (!transType) {
      return res.status(404).json({
        success: false,
        error: 'Transaction type not found'
      });
    }

    // Use Philippines (Asia/Manila) current datetime for transaction and last_visit
    const manilaNow = getManilaNow();

    // Insert transaction with explicit transaction_date (Manila time)
    const result = await dbRun(
      `INSERT INTO transactions (farmer_id, type_id, transaction_date, amount, description, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id,
        type_id,
        manilaNow,
        amount || 0,
        description || null,
        notes || null,
        created_by || 'Admin'
      ]
    );

    // Update farmer's last_visit using same Manila timestamp
    await dbRun(
      'UPDATE farmers SET last_visit = ? WHERE farmer_id = ?',
      [manilaNow, farmer_id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        transaction_id: result.id,
        farmer_id,
        type_id,
        amount: amount || 0,
        status: 'Completed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET transactions for a specific farmer
router.get('/farmer/:farmer_id', async (req, res) => {
  try {
    const transactions = await dbAll(
      `SELECT t.*, tt.type_name 
       FROM transactions t
       JOIN transaction_types tt ON t.type_id = tt.type_id
       WHERE t.farmer_id = ?
       ORDER BY t.transaction_date DESC`,
      [req.params.farmer_id]
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { farmer_id, type_id, start_date, end_date, page = 1, limit = 20 } = req.query;
    
    let sql = `SELECT t.*, f.first_name, f.last_name, tt.type_name 
               FROM transactions t
               JOIN farmers f ON t.farmer_id = f.farmer_id
               JOIN transaction_types tt ON t.type_id = tt.type_id
               WHERE 1=1`;
    const params = [];

    if (farmer_id) {
      sql += ' AND t.farmer_id = ?';
      params.push(farmer_id);
    }

    if (type_id) {
      sql += ' AND t.type_id = ?';
      params.push(type_id);
    }

    if (start_date) {
      sql += ' AND DATE(t.transaction_date) >= DATE(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND DATE(t.transaction_date) <= DATE(?)';
      params.push(end_date);
    }

    // Get total count
    const countSql = sql.replace(
      'SELECT t.*, f.first_name, f.last_name, tt.type_name',
      'SELECT COUNT(*) as count'
    );
    const countResult = await dbGet(countSql, params);
    const total = countResult.count;

    // Add ordering and pagination
    sql += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const transactions = await dbAll(sql, params);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single transaction
router.get('/:transaction_id', async (req, res) => {
  try {
    const transaction = await dbGet(
      `SELECT t.*, tt.type_name 
       FROM transactions t
       JOIN transaction_types tt ON t.type_id = tt.type_id
       WHERE t.transaction_id = ?`,
      [req.params.transaction_id]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
