-- Create FARMERS table
CREATE TABLE IF NOT EXISTS farmers (
  farmer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL UNIQUE,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  farm_name VARCHAR(150),
  farm_size DECIMAL(10, 2),
  farm_type VARCHAR(100),
  date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_visit DATETIME,
  notes TEXT
);

-- Create TRANSACTION_TYPES table
CREATE TABLE IF NOT EXISTS transaction_types (
  type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create TRANSACTIONS table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  type_id INTEGER NOT NULL,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(12, 2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Completed',
  notes TEXT,
  created_by VARCHAR(100) DEFAULT 'Admin',
  FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id),
  FOREIGN KEY (type_id) REFERENCES transaction_types(type_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmer_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_farmer_name ON farmers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_transaction_farmer_id ON transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_type_id ON transactions(type_id);
