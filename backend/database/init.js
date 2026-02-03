// Database initialization script
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'farmers_record.db');

// Create database and tables
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Read and execute schema
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

db.exec(schemaSql, (err) => {
  if (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
  console.log('✓ Database schema created successfully');

  // Ensure `middle_name` column exists (add if missing)
  db.run("ALTER TABLE farmers ADD COLUMN middle_name VARCHAR(100)", (err) => {
    if (err) {
      // Ignore if column already exists
      if (err.message && err.message.includes('duplicate column')) {
        // column already present, nothing to do
      } else {
        // Some SQLite versions return different error messages; ignore generic errors
      }
    } else {
      console.log('✓ Added middle_name column to farmers table');
    }
  });

  // Insert predefined transaction types
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
    if (index >= transactionTypes.length) {
      console.log('✓ Transaction types inserted successfully');
      
      // Insert sample data
      insertSampleData();
      return;
    }

    const type = transactionTypes[index];
    db.run(
      'INSERT OR IGNORE INTO transaction_types (type_name, description) VALUES (?, ?)',
      [type.name, type.desc],
      (err) => {
        if (err) {
          console.error('Error inserting transaction type:', err);
        }
        insertType(index + 1);
      }
    );
  };

  insertType(0);
});

// Insert sample farmers for testing
function insertSampleData() {
  const sampleFarmers = [
    {
      first_name: 'John',
      middle_name: '',
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
      middle_name: '',
      last_name: 'Smith',
      email: 'mary@example.com',
      phone: '555-0102',
      address: '456 Country Lane',
      city: 'Shelbyville',
      farm_name: 'Smith Estate',
      farm_size: 75,
      farm_type: 'Livestock'
    },
    {
      first_name: 'David',
      middle_name: '',
      last_name: 'Miller',
      email: 'david@example.com',
      phone: '555-0103',
      address: '789 Green Valley',
      city: 'Capital City',
      farm_name: 'Miller Ranch',
      farm_size: 120,
      farm_type: 'Mixed'
    }
  ];

  let farmerId = 1;
  const insertFarmer = (index) => {
    if (index >= sampleFarmers.length) {
      console.log('✓ Sample farmers inserted successfully');
      
      // Insert sample transactions
      insertSampleTransactions();
      return;
    }

    const farmer = sampleFarmers[index];
    db.run(
      `INSERT OR IGNORE INTO farmers 
       (first_name, middle_name, last_name, email, phone, address, city, farm_name, farm_size, farm_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer.first_name,
        farmer.middle_name || null,
        farmer.last_name,
        farmer.email,
        farmer.phone,
        farmer.address,
        farmer.city,
        farmer.farm_name,
        farmer.farm_size,
        farmer.farm_type
      ],
      (err) => {
        if (err) {
          console.error('Error inserting farmer:', err);
        }
        insertFarmer(index + 1);
      }
    );
  };

  insertFarmer(0);
}

// Insert sample transactions
function insertSampleTransactions() {
  const sampleTransactions = [
    { farmer_id: 1, type_id: 1, amount: 50000, desc: 'Initial loan application' },
    { farmer_id: 1, type_id: 3, amount: 5000, desc: 'Partial repayment' },
    { farmer_id: 2, type_id: 2, amount: 100000, desc: 'Loan disbursement' },
    { farmer_id: 3, type_id: 6, amount: 0, desc: 'Consultation meeting' }
  ];

  const insertTx = (index) => {
    if (index >= sampleTransactions.length) {
      console.log('✓ Sample transactions inserted successfully');
      console.log('\n✅ Database initialization completed!');
      console.log('Sample farmers are ready for testing\n');
      db.close();
      return;
    }

    const tx = sampleTransactions[index];
    db.run(
      `INSERT INTO transactions (farmer_id, type_id, amount, description) 
       VALUES (?, ?, ?, ?)`,
      [tx.farmer_id, tx.type_id, tx.amount, tx.desc],
      (err) => {
        if (err) {
          console.error('Error inserting transaction:', err);
        }
        insertTx(index + 1);
      }
    );
  };

  insertTx(0);
}
