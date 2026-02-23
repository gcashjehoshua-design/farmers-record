-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FRESH DATABASE SCHEMA
-- Drops existing tables and creates them from scratch
-- ============================================================

-- Drop existing triggers and views first
DROP TRIGGER IF EXISTS update_farmers_updated_at ON farmers;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- Drop existing tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- Create FARMERS table
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  barangay VARCHAR(200),
  zip_code VARCHAR(20),
  rsbsa_number TEXT,
  date_of_birth DATE,
  farm_type VARCHAR(100),
  farm_location TEXT,
  organization VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint for farm_type
  CONSTRAINT farmers_farm_type_check CHECK (
    farm_type IS NULL OR farm_type IN ('Rice farms', 'Corn', 'Sugar cane', 'Vegetable', 'Fruit')
  )
);

-- Create TRANSACTIONS table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  transaction_type VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2),
  description TEXT,
  notes TEXT,
  office_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_farmers_name_barangay ON farmers(full_name, barangay);
CREATE INDEX idx_farmers_organization ON farmers(organization);
CREATE INDEX idx_farmers_rsbsa ON farmers(rsbsa_number);
CREATE INDEX idx_farmers_phone ON farmers(phone);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_office_visit_at ON transactions(office_visit_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for farmers table
CREATE POLICY "Allow all operations on farmers" ON farmers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for transactions table
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Dashboard analytics view
CREATE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM farmers) AS total_farmers,
  (SELECT COUNT(*) FROM transactions) AS total_transactions,
  (SELECT COUNT(*) FROM transactions
    WHERE office_visit_at >= date_trunc('month', now())
      AND office_visit_at < (date_trunc('month', now()) + interval '1 month')
  ) AS visits_this_month,
  (SELECT COUNT(DISTINCT farmer_id) FROM transactions
    WHERE office_visit_at >= date_trunc('month', now())
      AND office_visit_at < (date_trunc('month', now()) + interval '1 month')
  ) AS farmers_visited_this_month;

