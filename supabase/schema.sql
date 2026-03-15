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
DROP TABLE IF EXISTS app_users CASCADE;

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
  gender VARCHAR(20),
  farm_type VARCHAR(100),
  farm_location TEXT,
  organization VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint for farm_type
  CONSTRAINT farmers_farm_type_check CHECK (
    farm_type IS NULL OR farm_type IN ('Rice farms', 'Corn', 'Sugar cane', 'Vegetable', 'Fruit')
  ),
  -- Constraint for gender
  CONSTRAINT farmers_gender_check CHECK (
    gender IS NULL OR gender IN ('Male', 'Female', 'Other')
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
CREATE INDEX idx_farmers_name_barangay ON farmers(full_name, barangay);
CREATE INDEX idx_farmers_organization ON farmers(organization);
CREATE INDEX idx_farmers_rsbsa ON farmers(rsbsa_number);
CREATE INDEX idx_farmers_phone ON farmers(phone);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_office_visit_at ON transactions(office_visit_at);
CREATE INDEX idx_app_users_auth_user_id ON app_users(auth_user_id);

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

-- Create policies for app_users table
-- Allow all authenticated users to read all profiles (needed for auth/UI)
CREATE POLICY "authenticated_can_read_users" ON app_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to INSERT their own profile (for signup/user creation)
CREATE POLICY "allow_insert_own_profile" ON app_users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

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

-- Dashboard analytics view (with SECURITY DEFINER for safety)
CREATE OR REPLACE VIEW dashboard_stats WITH (security_definer=on) AS
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

