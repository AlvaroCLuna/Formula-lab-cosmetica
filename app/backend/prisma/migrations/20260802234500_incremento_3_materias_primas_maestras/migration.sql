ALTER TABLE raw_material_masters
  MODIFY status ENUM('activo','inactivo','archivado','borrador','en_revision','validada') NOT NULL DEFAULT 'borrador';

UPDATE raw_material_masters SET status = 'validada' WHERE status = 'activo';
UPDATE raw_material_masters SET status = 'archivada' WHERE status = 'archivado';

ALTER TABLE raw_material_masters
  ADD COLUMN commercial_name VARCHAR(191) NULL,
  ADD COLUMN cas VARCHAR(191) NULL,
  ADD COLUMN ec VARCHAR(191) NULL,
  ADD COLUMN category VARCHAR(191) NULL,
  ADD COLUMN family VARCHAR(191) NULL,
  ADD COLUMN cosmetic_function VARCHAR(191) NULL,
  ADD COLUMN current_version_id VARCHAR(191) NULL,
  ADD COLUMN created_by_user_id VARCHAR(191) NULL,
  MODIFY status ENUM('borrador','en_revision','validada','archivada') NOT NULL DEFAULT 'borrador';

CREATE INDEX raw_material_masters_created_by_user_id_idx ON raw_material_masters(created_by_user_id);
ALTER TABLE raw_material_masters ADD CONSTRAINT raw_material_masters_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id);

CREATE TABLE raw_material_master_versions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  version_number INT NOT NULL,
  status ENUM('borrador','en_revision','validada','rechazada','obsoleta') NOT NULL DEFAULT 'borrador',
  commercial_name VARCHAR(191) NULL,
  common_name VARCHAR(191) NOT NULL,
  inci VARCHAR(191) NULL,
  cas VARCHAR(191) NULL,
  ec VARCHAR(191) NULL,
  category VARCHAR(191) NOT NULL,
  family VARCHAR(191) NULL,
  cosmetic_function VARCHAR(191) NOT NULL,
  description TEXT NULL,
  appearance VARCHAR(191) NULL,
  color VARCHAR(191) NULL,
  odor VARCHAR(191) NULL,
  solubility VARCHAR(191) NULL,
  density VARCHAR(191) NULL,
  pH VARCHAR(191) NULL,
  max_temperature VARCHAR(191) NULL,
  recommended_temperature VARCHAR(191) NULL,
  usage_range VARCHAR(191) NULL,
  storage_conditions TEXT NULL,
  shelf_life VARCHAR(191) NULL,
  contraindications TEXT NULL,
  compatibilities TEXT NULL,
  incompatibilities TEXT NULL,
  allergens TEXT NULL,
  observations TEXT NULL,
  examples_of_use TEXT NULL,
  evidence_summary TEXT NULL,
  confidence_level VARCHAR(191) NOT NULL DEFAULT 'pendiente',
  approved_by_user_id VARCHAR(191) NULL,
  approved_at DATETIME(3) NULL,
  snapshot_json JSON NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY raw_material_master_versions_master_version_unique (raw_material_master_id, version_number),
  KEY raw_material_master_versions_organization_id_idx (organization_id),
  KEY raw_material_master_versions_raw_material_master_id_idx (raw_material_master_id),
  KEY raw_material_master_versions_created_by_user_id_idx (created_by_user_id),
  CONSTRAINT raw_material_master_versions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_master_versions_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id),
  CONSTRAINT raw_material_master_versions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT raw_material_master_versions_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

CREATE TABLE raw_material_manufacturers (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  country VARCHAR(191) NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY raw_material_manufacturers_organization_id_idx (organization_id),
  KEY raw_material_manufacturers_raw_material_master_id_idx (raw_material_master_id),
  CONSTRAINT raw_material_manufacturers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_manufacturers_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id)
);

CREATE TABLE raw_material_suppliers (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  contact VARCHAR(191) NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY raw_material_suppliers_organization_id_idx (organization_id),
  KEY raw_material_suppliers_raw_material_master_id_idx (raw_material_master_id),
  CONSTRAINT raw_material_suppliers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_suppliers_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id)
);

CREATE TABLE raw_material_commercial_products (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  manufacturer_id VARCHAR(191) NULL,
  supplier_id VARCHAR(191) NULL,
  trade_name VARCHAR(191) NOT NULL,
  sku VARCHAR(191) NULL,
  average_cost DOUBLE NULL,
  currency VARCHAR(191) NULL DEFAULT 'MXN',
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY raw_material_commercial_products_organization_id_idx (organization_id),
  KEY raw_material_commercial_products_raw_material_master_id_idx (raw_material_master_id),
  KEY raw_material_commercial_products_manufacturer_id_idx (manufacturer_id),
  KEY raw_material_commercial_products_supplier_id_idx (supplier_id),
  CONSTRAINT raw_material_commercial_products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_commercial_products_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id),
  CONSTRAINT raw_material_commercial_products_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES raw_material_manufacturers(id),
  CONSTRAINT raw_material_commercial_products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES raw_material_suppliers(id)
);

CREATE TABLE raw_material_documents (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NULL,
  title VARCHAR(191) NOT NULL,
  document_type ENUM('pdf','tds','sds','coa','imagen','articulo','otro') NOT NULL,
  external_reference VARCHAR(191) NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY raw_material_documents_master_document_unique (raw_material_master_id, document_id),
  KEY raw_material_documents_organization_id_idx (organization_id),
  KEY raw_material_documents_raw_material_master_id_idx (raw_material_master_id),
  KEY raw_material_documents_document_id_idx (document_id),
  CONSTRAINT raw_material_documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_documents_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id),
  CONSTRAINT raw_material_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE raw_material_lots (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  raw_material_master_id VARCHAR(191) NOT NULL,
  lot_code VARCHAR(191) NOT NULL,
  expiration_date DATETIME(3) NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY raw_material_lots_organization_id_idx (organization_id),
  KEY raw_material_lots_raw_material_master_id_idx (raw_material_master_id),
  CONSTRAINT raw_material_lots_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_lots_raw_material_master_id_fkey FOREIGN KEY (raw_material_master_id) REFERENCES raw_material_masters(id)
);
