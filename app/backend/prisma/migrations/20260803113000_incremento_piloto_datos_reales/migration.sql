CREATE TABLE `pilot_products` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('piloto','archivado') NOT NULL DEFAULT 'piloto',
  `formulation_family_id` VARCHAR(191) NULL,
  `current_formulation_version_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `pilot_products_permanent_code_key`(`permanent_code`),
  INDEX `pilot_products_organization_id_idx`(`organization_id`),
  INDEX `pilot_products_category_idx`(`category`),
  INDEX `pilot_products_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_import_batches` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `source_name` VARCHAR(191) NOT NULL,
  `source_type` VARCHAR(191) NOT NULL,
  `import_kind` VARCHAR(191) NOT NULL,
  `status` ENUM('previsualizado','importado','requiere_revision','rechazado') NOT NULL DEFAULT 'previsualizado',
  `summary_json` JSON NULL,
  `created_by_user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `pilot_import_batches_permanent_code_key`(`permanent_code`),
  INDEX `pilot_import_batches_organization_id_idx`(`organization_id`),
  INDEX `pilot_import_batches_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_import_items` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `batch_id` VARCHAR(191) NOT NULL,
  `row_reference` VARCHAR(191) NOT NULL,
  `target_entity` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `status` ENUM('previsualizado','importado','requiere_revision','rechazado') NOT NULL DEFAULT 'previsualizado',
  `payload_json` JSON NOT NULL,
  `conflict_json` JSON NULL,
  `message` TEXT NULL,
  INDEX `pilot_import_items_organization_id_idx`(`organization_id`),
  INDEX `pilot_import_items_batch_id_idx`(`batch_id`),
  INDEX `pilot_import_items_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_lab_trials` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `pilot_product_id` VARCHAR(191) NULL,
  `lab_project_id` VARCHAR(191) NULL,
  `lab_sample_id` VARCHAR(191) NULL,
  `formulation_family_id` VARCHAR(191) NULL,
  `formulation_version_id` VARCHAR(191) NULL,
  `trial_size` DECIMAL(12,3) NOT NULL,
  `unit` VARCHAR(191) NOT NULL DEFAULT 'g',
  `objective` TEXT NOT NULL,
  `status` ENUM('planeada','en_proceso','terminada','cancelada') NOT NULL DEFAULT 'planeada',
  `result` ENUM('pendiente','satisfactorio','requiere_ajuste','fallido','repetir') NOT NULL DEFAULT 'pendiente',
  `responsible_user_id` VARCHAR(191) NOT NULL,
  `started_at` DATETIME(3) NULL,
  `finished_at` DATETIME(3) NULL,
  `what_worked` TEXT NULL,
  `what_failed` TEXT NULL,
  `suggested_changes` TEXT NULL,
  `observations` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `pilot_lab_trials_permanent_code_key`(`permanent_code`),
  INDEX `pilot_lab_trials_organization_id_idx`(`organization_id`),
  INDEX `pilot_lab_trials_pilot_product_id_idx`(`pilot_product_id`),
  INDEX `pilot_lab_trials_formulation_version_id_idx`(`formulation_version_id`),
  INDEX `pilot_lab_trials_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_lab_trial_parameters` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `trial_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `parameter_type` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `value_text` VARCHAR(191) NULL,
  `value_number` DECIMAL(12,4) NULL,
  `unit` VARCHAR(191) NULL,
  `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `user_id` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  UNIQUE INDEX `pilot_lab_trial_parameters_permanent_code_key`(`permanent_code`),
  INDEX `pilot_lab_trial_parameters_organization_id_idx`(`organization_id`),
  INDEX `pilot_lab_trial_parameters_trial_id_idx`(`trial_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_lab_trial_photos` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `trial_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `document_id` VARCHAR(191) NULL,
  `caption` TEXT NULL,
  `storage_path` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `pilot_lab_trial_photos_permanent_code_key`(`permanent_code`),
  INDEX `pilot_lab_trial_photos_organization_id_idx`(`organization_id`),
  INDEX `pilot_lab_trial_photos_trial_id_idx`(`trial_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pilot_experimental_versions` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `trial_id` VARCHAR(191) NOT NULL,
  `source_formulation_version_id` VARCHAR(191) NOT NULL,
  `experimental_formulation_version_id` VARCHAR(191) NULL,
  `change_summary` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'borrador',
  `created_by_user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `pilot_experimental_versions_permanent_code_key`(`permanent_code`),
  INDEX `pilot_experimental_versions_organization_id_idx`(`organization_id`),
  INDEX `pilot_experimental_versions_trial_id_idx`(`trial_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pilot_products` ADD CONSTRAINT `pilot_products_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_products` ADD CONSTRAINT `pilot_products_formulation_family_id_fkey` FOREIGN KEY (`formulation_family_id`) REFERENCES `formulation_families`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_products` ADD CONSTRAINT `pilot_products_current_formulation_version_id_fkey` FOREIGN KEY (`current_formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_import_batches` ADD CONSTRAINT `pilot_import_batches_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_import_batches` ADD CONSTRAINT `pilot_import_batches_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_import_items` ADD CONSTRAINT `pilot_import_items_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_import_items` ADD CONSTRAINT `pilot_import_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `pilot_import_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_pilot_product_id_fkey` FOREIGN KEY (`pilot_product_id`) REFERENCES `pilot_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_lab_project_id_fkey` FOREIGN KEY (`lab_project_id`) REFERENCES `lab_projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_lab_sample_id_fkey` FOREIGN KEY (`lab_sample_id`) REFERENCES `lab_samples`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_formulation_family_id_fkey` FOREIGN KEY (`formulation_family_id`) REFERENCES `formulation_families`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_formulation_version_id_fkey` FOREIGN KEY (`formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trials` ADD CONSTRAINT `pilot_lab_trials_responsible_user_id_fkey` FOREIGN KEY (`responsible_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_parameters` ADD CONSTRAINT `pilot_lab_trial_parameters_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_parameters` ADD CONSTRAINT `pilot_lab_trial_parameters_trial_id_fkey` FOREIGN KEY (`trial_id`) REFERENCES `pilot_lab_trials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_parameters` ADD CONSTRAINT `pilot_lab_trial_parameters_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_photos` ADD CONSTRAINT `pilot_lab_trial_photos_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_photos` ADD CONSTRAINT `pilot_lab_trial_photos_trial_id_fkey` FOREIGN KEY (`trial_id`) REFERENCES `pilot_lab_trials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_lab_trial_photos` ADD CONSTRAINT `pilot_lab_trial_photos_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_experimental_versions` ADD CONSTRAINT `pilot_experimental_versions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_experimental_versions` ADD CONSTRAINT `pilot_experimental_versions_trial_id_fkey` FOREIGN KEY (`trial_id`) REFERENCES `pilot_lab_trials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_experimental_versions` ADD CONSTRAINT `pilot_experimental_versions_source_formulation_version_id_fkey` FOREIGN KEY (`source_formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pilot_experimental_versions` ADD CONSTRAINT `pilot_experimental_versions_experimental_formulation_version_id_fkey` FOREIGN KEY (`experimental_formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pilot_experimental_versions` ADD CONSTRAINT `pilot_experimental_versions_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
