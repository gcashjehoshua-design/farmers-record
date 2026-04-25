-- Projects module
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_type VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
  implemented_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT projects_status_check CHECK (status IN ('ongoing', 'implemented'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

DROP POLICY IF EXISTS "authenticated_can_read_projects" ON projects;
CREATE POLICY "authenticated_can_read_projects" ON projects
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_can_insert_projects" ON projects;
CREATE POLICY "admin_can_insert_projects" ON projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "admin_can_update_projects" ON projects;
CREATE POLICY "admin_can_update_projects" ON projects
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
