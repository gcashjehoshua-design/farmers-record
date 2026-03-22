-- Apply on an existing Supabase project (SQL Editor or supabase db push).
-- 1) Ensures deleting a farmer removes their commodity rows (FK ON DELETE CASCADE).
-- 2) Enables RLS on farmer_commodities + policies (fixes Security Advisor).
-- 3) Recreates dashboard_stats as security invoker (fixes Security Advisor).

-- ---------------------------------------------------------------------------
-- Foreign key: cascade delete commodities when farmer is deleted
-- ---------------------------------------------------------------------------
ALTER TABLE farmer_commodities
  DROP CONSTRAINT IF EXISTS farmer_commodities_rsbsa_code_fkey;

ALTER TABLE farmer_commodities
  ADD CONSTRAINT farmer_commodities_rsbsa_code_fkey
  FOREIGN KEY (rsbsa_code)
  REFERENCES farmers(rsbsa_code)
  ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- RLS on farmer_commodities
-- ---------------------------------------------------------------------------
ALTER TABLE farmer_commodities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_read_farmer_commodities" ON farmer_commodities;
DROP POLICY IF EXISTS "authenticated_can_insert_farmer_commodities" ON farmer_commodities;
DROP POLICY IF EXISTS "authenticated_can_update_farmer_commodities" ON farmer_commodities;
DROP POLICY IF EXISTS "authenticated_can_delete_farmer_commodities" ON farmer_commodities;

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

-- ---------------------------------------------------------------------------
-- dashboard_stats: security invoker (not security definer)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS dashboard_stats;

CREATE VIEW dashboard_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM farmers) AS total_farmers,
  (SELECT COUNT(*) FROM transactions) AS total_transactions,
  (SELECT COUNT(*) FROM transactions
    WHERE office_visit_at >= date_trunc('month', now())
      AND office_visit_at < (date_trunc('month', now()) + interval '1 month')
  ) AS visits_this_month,
  (SELECT COUNT(DISTINCT rsbsa_code) FROM transactions
    WHERE office_visit_at >= date_trunc('month', now())
      AND office_visit_at < (date_trunc('month', now()) + interval '1 month')
  ) AS farmers_visited_this_month;

GRANT SELECT ON dashboard_stats TO anon, authenticated;
