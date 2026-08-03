ALTER TABLE documents
  ADD COLUMN permanent_code VARCHAR(191) NULL,
  ADD COLUMN knowledge_code VARCHAR(191) NULL,
  ADD COLUMN source_code VARCHAR(191) NULL,
  ADD COLUMN title VARCHAR(191) NULL,
  ADD COLUMN document_type_id VARCHAR(191) NULL,
  ADD COLUMN language VARCHAR(191) NULL DEFAULT 'es',
  ADD COLUMN author VARCHAR(191) NULL,
  ADD COLUMN supplier VARCHAR(191) NULL,
  ADD COLUMN manufacturer VARCHAR(191) NULL,
  ADD COLUMN detected_entity VARCHAR(191) NULL,
  ADD COLUMN document_date DATETIME(3) NULL,
  ADD COLUMN keywords_json JSON NULL,
  ADD COLUMN summary TEXT NULL,
  ADD COLUMN page_count INT NULL,
  ADD COLUMN table_count INT NULL,
  ADD COLUMN image_count INT NULL,
  ADD COLUMN indexing_status VARCHAR(191) NOT NULL DEFAULT 'pendiente',
  ADD COLUMN current_version_id VARCHAR(191) NULL,
  ADD UNIQUE KEY documents_permanent_code_key (permanent_code),
  ADD UNIQUE KEY documents_knowledge_code_key (knowledge_code),
  ADD UNIQUE KEY documents_source_code_key (source_code),
  ADD KEY documents_document_type_id_idx (document_type_id),
  ADD KEY documents_status_idx (status),
  ADD KEY documents_indexing_status_idx (indexing_status);

CREATE TABLE document_types (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NULL,
  code VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY document_types_org_code_unique (organization_id, code),
  KEY document_types_organization_id_idx (organization_id),
  KEY document_types_category_idx (category),
  CONSTRAINT document_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

ALTER TABLE documents
  ADD CONSTRAINT documents_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES document_types(id);

CREATE TABLE document_versions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  original_filename VARCHAR(191) NOT NULL,
  stored_filename VARCHAR(191) NOT NULL,
  mime_type VARCHAR(191) NOT NULL,
  file_extension VARCHAR(191) NOT NULL,
  size_bytes INT NOT NULL,
  storage_path VARCHAR(191) NOT NULL,
  checksum_sha256 VARCHAR(191) NULL,
  change_reason TEXT NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY document_versions_document_version_unique (document_id, version_number),
  KEY document_versions_organization_id_idx (organization_id),
  KEY document_versions_document_id_idx (document_id),
  CONSTRAINT document_versions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT document_versions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE document_tags (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  permanent_code VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  color VARCHAR(191) NOT NULL DEFAULT '#2563eb',
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY document_tags_permanent_code_key (permanent_code),
  UNIQUE KEY document_tags_org_name_unique (organization_id, name),
  KEY document_tags_organization_id_idx (organization_id),
  CONSTRAINT document_tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE document_tag_links (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  tag_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY document_tag_links_document_tag_unique (document_id, tag_id),
  KEY document_tag_links_organization_id_idx (organization_id),
  KEY document_tag_links_tag_id_idx (tag_id),
  CONSTRAINT document_tag_links_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT document_tag_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT document_tag_links_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES document_tags(id)
);

CREATE TABLE document_relations (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  entity_type VARCHAR(191) NOT NULL,
  entity_id VARCHAR(191) NOT NULL,
  relation_type VARCHAR(191) NOT NULL DEFAULT 'evidencia',
  source_reference VARCHAR(191) NULL,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0.80,
  validation_status VARCHAR(191) NOT NULL DEFAULT 'pendiente',
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY document_relations_organization_id_idx (organization_id),
  KEY document_relations_document_id_idx (document_id),
  KEY document_relations_entity_idx (entity_type, entity_id),
  CONSTRAINT document_relations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT document_relations_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT document_relations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE document_chunks (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  chunk_code VARCHAR(191) NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  source_reference VARCHAR(191) NULL,
  embedding_status VARCHAR(191) NOT NULL DEFAULT 'preparado',
  embedding_model VARCHAR(191) NULL,
  embedding_vector_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY document_chunks_chunk_code_key (chunk_code),
  UNIQUE KEY document_chunks_document_index_unique (document_id, chunk_index),
  KEY document_chunks_organization_id_idx (organization_id),
  KEY document_chunks_document_id_idx (document_id),
  CONSTRAINT document_chunks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE ocr_results (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NOT NULL,
  text TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0.75,
  detected_language VARCHAR(191) NULL DEFAULT 'es',
  engine VARCHAR(191) NOT NULL DEFAULT 'demo_ocr_preparado',
  source_reference VARCHAR(191) NULL,
  created_by_user_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ocr_results_organization_id_idx (organization_id),
  KEY ocr_results_document_id_idx (document_id),
  CONSTRAINT ocr_results_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT ocr_results_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT ocr_results_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE document_status (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NULL,
  code VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  UNIQUE KEY document_status_org_code_unique (organization_id, code),
  KEY document_status_organization_id_idx (organization_id),
  CONSTRAINT document_status_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE document_permissions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NULL,
  document_type_id VARCHAR(191) NULL,
  role VARCHAR(191) NOT NULL,
  permission VARCHAR(191) NOT NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_by_user_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY document_permissions_organization_id_idx (organization_id),
  KEY document_permissions_document_id_idx (document_id),
  KEY document_permissions_document_type_id_idx (document_type_id),
  CONSTRAINT document_permissions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT document_permissions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE knowledge_sources (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  permanent_code VARCHAR(191) NOT NULL,
  document_id VARCHAR(191) NULL,
  source_type VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  citation TEXT NULL,
  url VARCHAR(191) NULL,
  evidence_level VARCHAR(191) NOT NULL DEFAULT 'documental',
  validation_status VARCHAR(191) NOT NULL DEFAULT 'pendiente',
  approved_by_user_id VARCHAR(191) NULL,
  approved_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY knowledge_sources_permanent_code_key (permanent_code),
  KEY knowledge_sources_organization_id_idx (organization_id),
  KEY knowledge_sources_document_id_idx (document_id),
  CONSTRAINT knowledge_sources_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT knowledge_sources_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT knowledge_sources_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);
