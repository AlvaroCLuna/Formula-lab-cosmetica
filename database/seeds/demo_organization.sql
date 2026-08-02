INSERT INTO organizations (id, name, status)
VALUES ('demo-org', 'Formula Lab Demo', 'activo')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Password demo: FormulaLab2026!
INSERT INTO users (id, organization_id, email, password_hash, full_name, status)
VALUES (
  'demo-user',
  'demo-org',
  'demo@formulalab.local',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8QF6nbLoE9U7jX7MD7MWB5.Czc4I5i',
  'Usuaria Demo',
  'activo'
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
