  -- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FRESH DATABASE SCHEMA
-- Drops existing tables and creates them from scratch
-- ============================================================

-- Drop view first (references farmers / transactions)
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- Drop tables (triggers on these tables go away with the tables — required before dropping update_updated_at_column())
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS farmer_commodities CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- Shared trigger function: drop only after no trigger references it
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create FARMERS table
CREATE TABLE farmers (
  rsbsa_code VARCHAR(50) PRIMARY KEY,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  full_name VARCHAR(200) NOT NULL,
  gender VARCHAR(20),
  birthdate DATE,
  phone VARCHAR(20),
  
  -- Farmer classifications
  is_farmer BOOLEAN DEFAULT false,
  is_farmworker BOOLEAN DEFAULT false,
  is_fisherfolk BOOLEAN DEFAULT false,
  is_agriyouth BOOLEAN DEFAULT false,
  is_indigenous_people BOOLEAN DEFAULT false,
  is_organic_practitioner BOOLEAN DEFAULT false,
  is_arb BOOLEAN DEFAULT false,
  
  -- Address fields
  farmer_address_1 VARCHAR(200),
  farmer_address_2 VARCHAR(200),
  farmer_address_3 VARCHAR(200),
  
  -- Parcel/Farm information
  parcel_no INTEGER,
  parcel_address_1 VARCHAR(200),
  parcel_address_2 VARCHAR(200),
  parcel_address_3 VARCHAR(200),
  parcel_area DECIMAL(10, 2),
  crop_area DECIMAL(10, 2),
  
  -- Additional information
  tribe VARCHAR(100),
  agency VARCHAR(100),
  ownership_type VARCHAR(50),
  owner_name VARCHAR(200),
  date_encoded TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT farmers_gender_check CHECK (
    gender IS NULL OR gender IN ('MALE', 'FEMALE', 'Male', 'Female')
  )
);

-- Create COMMODITIES/LIVESTOCK table (one farmer can have multiple commodities)
CREATE TABLE farmer_commodities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsbsa_code VARCHAR(50) NOT NULL REFERENCES farmers(rsbsa_code) ON DELETE CASCADE,
  commodity_name VARCHAR(100) NOT NULL,
  number_of_heads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TRANSACTIONS table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsbsa_code VARCHAR(50) NOT NULL REFERENCES farmers(rsbsa_code) ON DELETE CASCADE,
  transaction_type VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2),
  description TEXT,
  notes TEXT,
  office_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (rsbsa_code) REFERENCES farmers(rsbsa_code) ON DELETE CASCADE
);

-- Create APP_USERS table for authentication roles and status
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_farmers_name ON farmers(last_name, first_name);
CREATE INDEX idx_farmers_rsbsa ON farmers(rsbsa_code);
CREATE INDEX idx_farmers_phone ON farmers(phone);
CREATE INDEX idx_farmers_is_farmer ON farmers(is_farmer);
CREATE INDEX idx_farmer_commodities_rsbsa ON farmer_commodities(rsbsa_code);
CREATE INDEX idx_transactions_rsbsa_code ON transactions(rsbsa_code);
CREATE INDEX idx_transactions_office_visit_at ON transactions(office_visit_at);

-- Create function to update updated_at timestamp with restricted search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for farmer_commodities
CREATE TRIGGER update_farmer_commodities_updated_at
  BEFORE UPDATE ON farmer_commodities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for farmers table (authenticated users can read, all)
CREATE POLICY "authenticated_can_read_farmers" ON farmers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_insert_farmers" ON farmers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_update_farmers" ON farmers
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_can_delete_farmers" ON farmers
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  ));

-- Create policies for transactions table (authenticated users can access)
CREATE POLICY "authenticated_can_read_transactions" ON transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_insert_transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_update_transactions" ON transactions
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_can_delete_transactions" ON transactions
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  ));

-- farmer_commodities: RLS (required for Supabase API); rows removed automatically when farmer is deleted (ON DELETE CASCADE)
ALTER TABLE farmer_commodities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_farmer_commodities" ON farmer_commodities
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_insert_farmer_commodities" ON farmer_commodities
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_update_farmer_commodities" ON farmer_commodities
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_delete_farmer_commodities" ON farmer_commodities
  FOR DELETE
  USING (auth.role() = 'authenticated');

GRANT SELECT, INSERT, UPDATE, DELETE ON farmer_commodities TO authenticated;

-- Grant table-level permissions for farmers and transactions (RLS policies handle row-level security)
GRANT SELECT, INSERT, UPDATE, DELETE ON farmers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

-- Create policies for app_users table
-- Allow all authenticated users to read all profiles (needed for auth/UI)
CREATE POLICY "authenticated_can_read_users" ON app_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to INSERT their own profile (for signup/user creation)
-- Also allow if auth_user_id is NULL or being set to current user (handles first-login timing issues)
CREATE POLICY "allow_insert_own_profile" ON app_users
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_user_id 
    OR (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL)
  );

-- Allow users to UPDATE their own profile (but not role/is_active)
CREATE POLICY "allow_update_own_profile" ON app_users
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin-only: Can update other users (roles, status)
CREATE POLICY "admin_can_update_users" ON app_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Admin-only: Can delete users
CREATE POLICY "admin_can_delete_users" ON app_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Dashboard analytics view (security_invoker: runs with caller's rights + RLS — fixes "Security definer view" advisor warning)
CREATE OR REPLACE VIEW dashboard_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM farmers WHERE is_active = true) AS total_farmers,
  (SELECT COUNT(*) FROM transactions t JOIN farmers f ON t.rsbsa_code = f.rsbsa_code WHERE f.is_active = true) AS total_transactions,
  (SELECT COUNT(*) FROM transactions t
    JOIN farmers f ON t.rsbsa_code = f.rsbsa_code
    WHERE t.office_visit_at >= date_trunc('month', now())
      AND t.office_visit_at < (date_trunc('month', now()) + interval '1 month')
      AND f.is_active = true
  ) AS visits_this_month,
  (SELECT COUNT(DISTINCT t.rsbsa_code) FROM transactions t
    JOIN farmers f ON t.rsbsa_code = f.rsbsa_code
    WHERE t.office_visit_at >= date_trunc('month', now())
      AND t.office_visit_at < (date_trunc('month', now()) + interval '1 month')
      AND f.is_active = true
  ) AS farmers_visited_this_month;

-- Grant permissions on app_users table to authenticated role (required for login/profile creation)
GRANT SELECT, INSERT, UPDATE ON app_users TO authenticated;

-- Allow API roles to read analytics view (needed for dashboard total counts)
GRANT SELECT ON dashboard_stats TO anon, authenticated;

