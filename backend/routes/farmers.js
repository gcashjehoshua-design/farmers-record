// routes/farmers.js - API routes for farmer management

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
  const y = map.year;
  const m = map.month;
  const d = map.day;
  const hh = map.hour;
  const mm = map.minute;
  const ss = map.second;
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// GET all farmers with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await dbGet('SELECT COUNT(*) as count FROM farmers');
    const total = countResult.count;

    // Get paginated farmers
    const farmers = await dbAll(
      'SELECT * FROM farmers ORDER BY date_registered DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      success: true,
      data: farmers,
      pagination: {
        page,
        limit,
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

// GET single farmer with transaction history
router.get('/:farmer_id', async (req, res) => {
  try {
    const farmer = await dbGet(
      'SELECT * FROM farmers WHERE farmer_id = ?',
      [req.params.farmer_id]
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }

    // Get transaction history
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
      data: {
        ...farmer,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create new farmer
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      farm_name,
      farm_size,
      farm_type,
      notes
    } = req.body;

    // Validation
    if (!first_name || !last_name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and phone are required'
      });
    }

    // Generate current timestamp for date_registered using Manila timezone
    const dateRegistered = getManilaNow();

    const result = await dbRun(
      `INSERT INTO farmers 
       (first_name, middle_name, last_name, email, phone, address, city, state, postal_code, farm_name, farm_size, farm_type, notes, date_registered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        middle_name || null,
        last_name,
        email || null,
        phone,
        address || null,
        city || null,
        state || null,
        postal_code || null,
        farm_name || null,
        farm_size || null,
        farm_type || null,
        notes || null,
        dateRegistered
      ]
    );

    // Fetch the created farmer row (includes date_registered)
    const createdFarmer = await dbGet('SELECT * FROM farmers WHERE farmer_id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Farmer created successfully',
      data: createdFarmer
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT update farmer
router.put('/:farmer_id', async (req, res) => {
  try {
    const farmer = await dbGet(
      'SELECT * FROM farmers WHERE farmer_id = ?',
      [req.params.farmer_id]
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }

    const {
      first_name,
      middle_name,
      last_name,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      farm_name,
      farm_size,
      farm_type,
      notes
    } = req.body;

    await dbRun(
      `UPDATE farmers SET 
       first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, address = ?, 
       city = ?, state = ?, postal_code = ?, farm_name = ?, farm_size = ?, 
       farm_type = ?, notes = ? WHERE farmer_id = ?`,
      [
        first_name || farmer.first_name,
        middle_name !== undefined ? middle_name : farmer.middle_name,
        last_name || farmer.last_name,
        email !== undefined ? email : farmer.email,
        phone || farmer.phone,
        address !== undefined ? address : farmer.address,
        city !== undefined ? city : farmer.city,
        state !== undefined ? state : farmer.state,
        postal_code !== undefined ? postal_code : farmer.postal_code,
        farm_name !== undefined ? farm_name : farmer.farm_name,
        farm_size !== undefined ? farm_size : farmer.farm_size,
        farm_type !== undefined ? farm_type : farmer.farm_type,
        notes !== undefined ? notes : farmer.notes,
        req.params.farmer_id
      ]
    );

    res.json({
      success: true,
      message: 'Farmer updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET search farmers
router.get('/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    
    const farmers = await dbAll(
      `SELECT * FROM farmers 
       WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR farm_name LIKE ?
       ORDER BY first_name ASC
       LIMIT 20`,
      [query, query, query, query]
    );

    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
