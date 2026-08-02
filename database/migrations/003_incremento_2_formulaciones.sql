-- Incremento 2 - Gestor de Formulaciones
-- MySQL/MariaDB reference migration aligned with Prisma schema.

CREATE TABLE IF NOT EXISTS raw_material_masters (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  permanent_code VARCHAR(191) NOT NULL,
  common_name VARCHAR(191) NOT NULL,
  inci VARCHAR(191) NULL,
  status ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY raw_material_masters_org_code_unique (organization_id, permanent_code),
  KEY raw_material_masters_organization_id_idx (organization_id),
  CONSTRAINT raw_material_masters_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS formulation_families (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  permanent_code VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(191) NOT NULL,
  status ENUM('activa', 'en_desarrollo', 'archivada', 'obsoleta') NOT NULL DEFAULT 'en_desarrollo',
  current_version_id VARCHAR(191) NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY formulation_families_org_code_unique (organization_id, permanent_code),
  KEY formulation_families_organization_id_idx (organization_id),
  KEY formulation_families_created_by_user_id_idx (created_by_user_id),
  CONSTRAINT formulation_families_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT formulation_families_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS formulation_versions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  formulation_family_id VARCHAR(191) NOT NULL,
  version_number INT NOT NULL,
  status ENUM('borrador', 'en_revision', 'aprobada', 'rechazada', 'obsoleta') NOT NULL DEFAULT 'borrador',
  name VARCHAR(191) NOT NULL,
  category VARCHAR(191) NOT NULL,
  objective TEXT NULL,
  notes TEXT NULL,
  approved_by_user_id VARCHAR(191) NULL,
  approved_at DATETIME(3) NULL,
  snapshot_json JSON NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY formulation_versions_family_version_unique (formulation_family_id, version_number),
  KEY formulation_versions_organization_id_idx (organization_id),
  KEY formulation_versions_created_by_user_id_idx (created_by_user_id),
  KEY formulation_versions_approved_by_user_id_idx (approved_by_user_id),
  CONSTRAINT formulation_versions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT formulation_versions_family_id_fkey FOREIGN KEY (formulation_family_id) REFERENCES formulation_families(id),
  CONSTRAINT formulation_versions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT formulation_versions_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS formulation_ingredients (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  formulation_version_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NULL,
  display_name VARCHAR(191) NOT NULL,
  inci VARCHAR(191) NULL,
  cosmetic_function VARCHAR(191) NOT NULL,
  phase VARCHAR(191) NOT NULL,
  percentage DOUBLE NOT NULL,
  base_quantity DOUBLE NOT NULL,
  unit VARCHAR(191) NOT NULL DEFAULT 'g',
  order_index INT NOT NULL,
  source_type ENUM('materia_prima_maestra', 'provisional') NOT NULL DEFAULT 'provisional',
  source_reference VARCHAR(191) NULL,
  estimated_cost DOUBLE NULL,
  production_notes TEXT NULL,
  inventory_lock_policy VARCHAR(191) NULL,
  status ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY formulation_ingredients_organization_id_idx (organization_id),
  KEY formulation_ingredients_version_id_idx (formulation_version_id),
  KEY formulation_ingredients_raw_material_id_idx (raw_material_master_id),
  CONSTRAINT formulation_ingredients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT formulation_ingredients_version_id_fkey FOREIGN KEY (formulation_version_id) REFERENCES formulation_versions(id),
  CONSTRAINT formulation_ingredients_raw_material_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id)
);

CREATE TABLE IF NOT EXISTS formulation_version_comparisons (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  base_version_id VARCHAR(191) NOT NULL,
  target_version_id VARCHAR(191) NOT NULL,
  summary_json JSON NOT NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY formulation_version_comparisons_organization_id_idx (organization_id),
  KEY formulation_version_comparisons_base_version_id_idx (base_version_id),
  KEY formulation_version_comparisons_target_version_id_idx (target_version_id),
  CONSTRAINT formulation_version_comparisons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT formulation_version_comparisons_base_version_id_fkey FOREIGN KEY (base_version_id) REFERENCES formulation_versions(id),
  CONSTRAINT formulation_version_comparisons_target_version_id_fkey FOREIGN KEY (target_version_id) REFERENCES formulation_versions(id),
  CONSTRAINT formulation_version_comparisons_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
