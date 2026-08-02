CREATE TABLE organizations (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  status ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE users (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(191) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  status ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX users_organization_id_idx (organization_id),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE password_reset_requests (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  token_hash VARCHAR(191) NOT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'preparado',
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX password_reset_requests_user_id_idx (user_id),
  CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE documents (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  uploaded_by_user_id VARCHAR(191) NOT NULL,
  original_filename VARCHAR(191) NOT NULL,
  stored_filename VARCHAR(191) NOT NULL,
  mime_type VARCHAR(191) NOT NULL,
  file_extension VARCHAR(24) NOT NULL,
  size_bytes INT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  status ENUM('pendiente', 'procesando', 'procesado', 'requiere_revision', 'rechazado') NOT NULL DEFAULT 'pendiente',
  rejection_reason VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX documents_organization_id_idx (organization_id),
  INDEX documents_uploaded_by_user_id_idx (uploaded_by_user_id),
  CONSTRAINT documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE document_processing_jobs (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  status ENUM('pendiente', 'procesando', 'completado', 'fallido') NOT NULL DEFAULT 'pendiente',
  started_at DATETIME(3) NULL,
  finished_at DATETIME(3) NULL,
  error_message TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX document_processing_jobs_organization_id_idx (organization_id),
  INDEX document_processing_jobs_document_id_idx (document_id),
  CONSTRAINT document_processing_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE raw_material_drafts (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  status ENUM('borrador', 'aprobado', 'rechazado') NOT NULL DEFAULT 'borrador',
  approved_version_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX raw_material_drafts_organization_id_idx (organization_id),
  INDEX raw_material_drafts_created_by_user_id_idx (created_by_user_id),
  CONSTRAINT raw_material_drafts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT raw_material_drafts_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE extracted_values (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  draft_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  field_key VARCHAR(191) NOT NULL,
  field_label VARCHAR(191) NOT NULL,
  value TEXT NULL,
  source_document_name VARCHAR(191) NOT NULL,
  source_reference VARCHAR(191) NOT NULL,
  data_type VARCHAR(191) NOT NULL,
  evidence_type ENUM('documental', 'inferido') NOT NULL DEFAULT 'documental',
  confidence DOUBLE NOT NULL,
  validation_status ENUM('pendiente', 'validado', 'corregido', 'en_conflicto', 'rechazado') NOT NULL DEFAULT 'pendiente',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX extracted_values_organization_id_idx (organization_id),
  INDEX extracted_values_draft_id_idx (draft_id),
  INDEX extracted_values_document_id_idx (document_id),
  CONSTRAINT extracted_values_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES raw_material_drafts(id),
  CONSTRAINT extracted_values_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE raw_material_validated_versions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  draft_id VARCHAR(191) NOT NULL,
  version_number INT NOT NULL,
  approved_by_user_id VARCHAR(191) NOT NULL,
  approved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  snapshot_json JSON NOT NULL,
  UNIQUE raw_material_validated_versions_draft_id_version_number_key (draft_id, version_number),
  INDEX raw_material_validated_versions_organization_id_idx (organization_id),
  CONSTRAINT raw_material_validated_versions_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES raw_material_drafts(id),
  CONSTRAINT raw_material_validated_versions_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

CREATE TABLE audit_log (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  entity_type VARCHAR(191) NOT NULL,
  entity_id VARCHAR(191) NOT NULL,
  action VARCHAR(191) NOT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX audit_log_organization_id_idx (organization_id),
  INDEX audit_log_user_id_idx (user_id),
  INDEX audit_log_entity_type_entity_id_idx (entity_type, entity_id),
  CONSTRAINT audit_log_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);
