// database/db.js - Database connection and helper functions

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const dbPath = path.join(__dirname, 'farmers_record.db');
let dbInitialized = false;
let initPromise = null;

// Choose backend based on DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || null;
let db = null; // sqlite Database or pg Pool

if (DATABASE_URL) {
  // Postgres pool
  db = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('Using Postgres for persistence');
} else {
  // SQLite
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
      process.exit(1);
    } else {
      console.log('✓ Connected to SQLite database');
    }
  });
}

// Return promise that resolves when DB is initialized
function getInitPromise() {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    if (DATABASE_URL) {
      // Run schema on Postgres
      try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        // Simple transformation for Postgres: replace AUTOINCREMENT and DATETIME
        const pgSchema = schemaSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY').replace(/DATETIME/g, 'TIMESTAMP');
        db.query(pgSchema).then(() => {
          console.log('✓ Postgres schema ready');
          insertTransactionTypesPG().then(() => insertSampleDataPG()).then(() => { dbInitialized = true; resolve(); }).catch(reject);
        }).catch((err) => { console.error('Error creating Postgres tables:', err); reject(err); });
      } catch (err) {
        console.error('Error reading schema.sql for Postgres:', err);
        reject(err);
      }
    } else {
      // SQLite path
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) { reject(err); return; }
        try {
          const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
          db.exec(schemaSql, (err) => {
            if (err) { console.error('Error creating tables:', err); reject(err); return; }
            console.log('✓ Database schema ready');
            insertTransactionTypes();
            insertSampleData();
            dbInitialized = true;
            resolve();
          });
        } catch (error) { console.error('Error reading schema file:', error); reject(error); }
      });
    }
  });
  return initPromise;
}

const isPostgres = !!DATABASE_URL;

// Insert default transaction types (SQLite)
function insertTransactionTypes() {
  const transactionTypes = [
    { name: 'Loan Application', desc: 'Farmer applying for loan' },
    { name: 'Loan Disbursement', desc: 'Releasing loan amount' },
    { name: 'Loan Repayment', desc: 'Farmer repaying loan' },
    { name: 'Equipment Request', desc: 'Request for farming equipment' },
    { name: 'Fertilizer Purchase', desc: 'Buying fertilizer supplies' },
    { name: 'Consultation', desc: 'Meeting with agricultural advisor' },
    { name: 'Training Session', desc: 'Attending training workshop' },
    { name: 'Report Submission', desc: 'Submitting farm reports' }
  ];

  const insertType = (index) => {
    if (index >= transactionTypes.length) return;
    
    const type = transactionTypes[index];
    db.run(
      'INSERT OR IGNORE INTO transaction_types (type_name, description) VALUES (?, ?)',
      [type.name, type.desc],
      (err) => {
        if (err && !err.message.includes('UNIQUE')) {
          console.error('Error inserting transaction type:', err);
        }
        insertType(index + 1);
      }
    );
  };

  insertType(0);
}

// Insert sample data
function insertSampleData() {
  const sampleFarmers = [
    {
      first_name: 'John',
      middle_name: 'David',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0101',
      address: '123 Farm Road',
      city: 'Springfield',
      farm_name: "Doe's Farm",
      farm_size: 50.5,
      farm_type: 'Crop'
    },
    {
      first_name: 'Mary',
      middle_name: 'Elizabeth',
      last_name: 'Smith',
      email: 'mary@example.com',
      phone: '555-0102',
      address: '456 Country Lane',
      city: 'Shelbyville',
      farm_name: "Smith's Dairy",
      farm_size: 30,
      farm_type: 'Livestock'
    }
  ];

  sampleFarmers.forEach(farmer => {
    db.run(
      `INSERT OR IGNORE INTO farmers (first_name, middle_name, last_name, email, phone, address, city, farm_name, farm_size, farm_type, date_registered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [farmer.first_name, farmer.middle_name, farmer.last_name, farmer.email, farmer.phone, farmer.address, farmer.city, farmer.farm_name, farmer.farm_size, farmer.farm_type],
      (err) => {
        if (err && !err.message.includes('UNIQUE')) {
          console.error('Error inserting sample farmer:', err);
        }
      }
    );
  });
}
// Postgres-specific helpers for inserting types and sample data
async function insertTransactionTypesPG() {
  const transactionTypes = [
    { name: 'Loan Application', desc: 'Farmer applying for loan' },
    { name: 'Loan Disbursement', desc: 'Releasing loan amount' },
    { name: 'Loan Repayment', desc: 'Farmer repaying loan' },
    { name: 'Equipment Request', desc: 'Request for farming equipment' },
    { name: 'Fertilizer Purchase', desc: 'Buying fertilizer supplies' },
    { name: 'Consultation', desc: 'Meeting with agricultural advisor' },
    { name: 'Training Session', desc: 'Attending training workshop' },
    { name: 'Report Submission', desc: 'Submitting farm reports' }
  ];

  for (const t of transactionTypes) {
    await db.query('INSERT INTO transaction_types (type_name, description) VALUES ($1, $2) ON CONFLICT (type_name) DO NOTHING', [t.name, t.desc]);
  }
}

async function insertSampleDataPG() {
  const sampleFarmers = [
    {
      first_name: 'John',
      middle_name: 'David',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0101',
      address: '123 Farm Road',
      city: 'Springfield',
      farm_name: "Doe's Farm",
      farm_size: 50.5,
      farm_type: 'Crop'
    },
    {
      first_name: 'Mary',
      middle_name: 'Elizabeth',
      last_name: 'Smith',
      email: 'mary@example.com',
      phone: '555-0102',
      address: '456 Country Lane',
      city: 'Shelbyville',
      farm_name: "Smith's Dairy",
      farm_size: 30,
      farm_type: 'Livestock'
    }
  ];

  for (const f of sampleFarmers) {
    await db.query(
      `INSERT INTO farmers (first_name, middle_name, last_name, email, phone, address, city, farm_name, farm_size, farm_type, date_registered)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)
       ON CONFLICT (phone) DO NOTHING`,
      [f.first_name, f.middle_name, f.last_name, f.email, f.phone, f.address, f.city, f.farm_name, f.farm_size, f.farm_type]
    );
  }
}

// Enable foreign keys for SQLite
if (!isPostgres) {
  db.run('PRAGMA foreign_keys = ON');
}

// Helper function to run queries with promises (works for both SQLite and Postgres)
const dbRun = (sql, params = []) => {
  if (isPostgres) {
    // Ensure inserts return rows so callers can read inserted id
    const text = /^\s*INSERT/i.test(sql) && !/RETURNING\s+/i.test(sql) ? sql + ' RETURNING *' : sql;
    return db.query(text, params).then((res) => ({ id: res.rows && res.rows[0] ? (res.rows[0].farmer_id || res.rows[0].transaction_id || res.rows[0].type_id || res.rows[0].id) : null, changes: res.rowCount })).catch((err) => { throw err; });
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get single row
const dbGet = (sql, params = []) => {
  if (isPostgres) {
    return db.query(sql, params).then((res) => res.rows[0] || null);
  }
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get all rows
const dbAll = (sql, params = []) => {
  if (isPostgres) {
    return db.query(sql, params).then((res) => res.rows || []);
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  getInitPromise
};
