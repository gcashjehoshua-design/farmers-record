-- Mark previously hardcoded project options as implemented (today),
-- and insert missing predefined projects as implemented.

WITH predefined(project_type) AS (
  VALUES
    ('Crop Insurance'),
    ('Livestock Insurance'),
    ('ABSS'),
    ('RCEF Inbred Seed Assistance'),
    ('Hybrid Seed Assistance'),
    ('Inbred Seed Fertilizer Assistance'),
    ('Hybrid Seed Fertilizer Assistance'),
    ('Farmers Financial Assistance - Loan'),
    ('Farmers Financial Assistance - RFFA'),
    ('Rabies Vaccination'),
    ('Livestock / Poultry Treatment'),
    ('Training'),
    ('Technical Assistance'),
    ('Soil Analysis')
)
UPDATE projects p
SET
  status = 'implemented',
  implemented_at = CURRENT_DATE
FROM predefined d
WHERE p.project_type = d.project_type;

WITH predefined(project_type) AS (
  VALUES
    ('Crop Insurance'),
    ('Livestock Insurance'),
    ('ABSS'),
    ('RCEF Inbred Seed Assistance'),
    ('Hybrid Seed Assistance'),
    ('Inbred Seed Fertilizer Assistance'),
    ('Hybrid Seed Fertilizer Assistance'),
    ('Farmers Financial Assistance - Loan'),
    ('Farmers Financial Assistance - RFFA'),
    ('Rabies Vaccination'),
    ('Livestock / Poultry Treatment'),
    ('Training'),
    ('Technical Assistance'),
    ('Soil Analysis')
)
INSERT INTO projects (project_type, status, implemented_at)
SELECT d.project_type, 'implemented', CURRENT_DATE
FROM predefined d
WHERE NOT EXISTS (
  SELECT 1
  FROM projects p
  WHERE p.project_type = d.project_type
);
