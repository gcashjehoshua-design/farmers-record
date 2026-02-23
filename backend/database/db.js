// database/db.js - SQLite-only database connection and helper functions

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'farmers_record.db');
let initPromise = null;

// Open SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
    process.exit(1);
  } else {
    console.log('✓ Connected to SQLite database');
  }
});

function getInitPromise() {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) return reject(err);
      try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        db.exec(schemaSql, (err) => {
          if (err) { console.error('Error creating tables:', err); return reject(err); }
          console.log('✓ Database schema ready');
          insertTransactionTypes();
          insertSampleData();
          resolve();
        });
      } catch (error) {
        console.error('Error reading schema file:', error);
        reject(error);
      }
    });
  });
  return initPromise;
}

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

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
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
