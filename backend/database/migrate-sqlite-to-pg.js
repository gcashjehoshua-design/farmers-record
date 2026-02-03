#!/usr/bin/env node
// migrate-sqlite-to-pg.js
// Copies data from local SQLite database to a Postgres database.

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'farmers_record.db');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Set it to your Postgres connection string.');
  process.exit(1);
}

const pg = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
const sqlite = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
    process.exit(1);
  }
});

async function queryAllSqlite(sql) {
  return new Promise((resolve, reject) => {
    sqlite.all(sql, (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });
}

async function migrate() {
  try {
    console.log('Starting migration from', SQLITE_PATH);

    // 1) Transfer transaction_types
    const types = await queryAllSqlite('SELECT * FROM transaction_types');
    console.log('Found', types.length, 'transaction types');
    for (const t of types) {
      await pg.query(
        'INSERT INTO transaction_types (type_id, type_name, description, created_date) VALUES ($1,$2,$3,$4) ON CONFLICT (type_id) DO NOTHING',
        [t.type_id, t.type_name, t.description, t.created_date]
      );
    }

    // 2) Transfer farmers
    const farmers = await queryAllSqlite('SELECT * FROM farmers');
    console.log('Found', farmers.length, 'farmers');
    for (const f of farmers) {
      await pg.query(
        `INSERT INTO farmers (farmer_id, first_name, middle_name, last_name, email, phone, address, city, state, postal_code, farm_name, farm_size, farm_type, date_registered, last_visit, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (farmer_id) DO NOTHING`,
        [f.farmer_id, f.first_name, f.middle_name, f.last_name, f.email, f.phone, f.address, f.city, f.state, f.postal_code, f.farm_name, f.farm_size, f.farm_type, f.date_registered, f.last_visit, f.notes]
      );
    }

    // 3) Transfer transactions
    const transactions = await queryAllSqlite('SELECT * FROM transactions');
    console.log('Found', transactions.length, 'transactions');
    for (const tx of transactions) {
      await pg.query(
        `INSERT INTO transactions (transaction_id, farmer_id, type_id, transaction_date, amount, description, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (transaction_id) DO NOTHING`,
        [tx.transaction_id, tx.farmer_id, tx.type_id, tx.transaction_date, tx.amount, tx.description, tx.status, tx.notes, tx.created_by]
      );
    }

    console.log('Migration completed successfully');
    await pg.end();
    sqlite.close();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
