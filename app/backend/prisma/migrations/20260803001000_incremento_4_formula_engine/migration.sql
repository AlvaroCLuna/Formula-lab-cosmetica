CREATE TABLE formulation_phases (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  formulation_version_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  order_index INT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY formulation_phases_version_name_unique (formulation_version_id, name),
  KEY formulation_phases_organization_id_idx (organization_id),
  KEY formulation_phases_formulation_version_id_idx (formulation_version_id),
  CONSTRAINT formulation_phases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT formulation_phases_formulation_version_id_fkey FOREIGN KEY (formulation_version_id) REFERENCES formulation_versions(id)
);
