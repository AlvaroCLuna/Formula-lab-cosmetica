CREATE TABLE `bi_dashboards` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `config_json` JSON NOT NULL,
  `filters_json` JSON NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_dashboards_permanent_code_key`(`permanent_code`),
  INDEX `bi_dashboards_organization_id_idx`(`organization_id`),
  INDEX `bi_dashboards_module_idx`(`module`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bi_reports` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `module` VARCHAR(191) NOT NULL,
  `entity` VARCHAR(191) NOT NULL,
  `fields_json` JSON NOT NULL,
  `filters_json` JSON NULL,
  `group_by_json` JSON NULL,
  `order_json` JSON NULL,
  `period_json` JSON NULL,
  `format` ENUM('csv', 'xlsx', 'pdf', 'json') NOT NULL DEFAULT 'csv',
  `columns_json` JSON NULL,
  `totals_json` JSON NULL,
  `created_by_user_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_reports_permanent_code_key`(`permanent_code`),
  INDEX `bi_reports_organization_id_idx`(`organization_id`),
  INDEX `bi_reports_module_idx`(`module`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bi_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `metric_key` VARCHAR(191) NOT NULL,
  `period_start` DATETIME(3) NOT NULL,
  `period_end` DATETIME(3) NOT NULL,
  `value_json` JSON NOT NULL,
  `source_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_snapshots_permanent_code_key`(`permanent_code`),
  INDEX `bi_snapshots_organization_id_idx`(`organization_id`),
  INDEX `bi_snapshots_module_idx`(`module`),
  INDEX `bi_snapshots_metric_key_idx`(`metric_key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bi_executive_alerts` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `alert_type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `detected` TEXT NOT NULL,
  `criterion` TEXT NOT NULL,
  `source` TEXT NOT NULL,
  `severity` ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  `entity_type` VARCHAR(191) NULL,
  `entity_id` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'abierta',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_executive_alerts_permanent_code_key`(`permanent_code`),
  INDEX `bi_executive_alerts_organization_id_idx`(`organization_id`),
  INDEX `bi_executive_alerts_module_idx`(`module`),
  INDEX `bi_executive_alerts_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bi_exports` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `report_id` VARCHAR(191) NULL,
  `module` VARCHAR(191) NOT NULL,
  `format` ENUM('csv', 'xlsx', 'pdf', 'json') NOT NULL,
  `filters_json` JSON NULL,
  `row_count` INTEGER NOT NULL DEFAULT 0,
  `storage_path` VARCHAR(191) NULL,
  `exported_by_user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_exports_permanent_code_key`(`permanent_code`),
  INDEX `bi_exports_organization_id_idx`(`organization_id`),
  INDEX `bi_exports_module_idx`(`module`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bi_schedules` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `report_id` VARCHAR(191) NOT NULL,
  `frequency` VARCHAR(191) NOT NULL,
  `responsible_user_id` VARCHAR(191) NOT NULL,
  `next_run_at` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'preparado',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bi_schedules_permanent_code_key`(`permanent_code`),
  INDEX `bi_schedules_organization_id_idx`(`organization_id`),
  INDEX `bi_schedules_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bi_dashboards` ADD CONSTRAINT `bi_dashboards_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_reports` ADD CONSTRAINT `bi_reports_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_reports` ADD CONSTRAINT `bi_reports_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_snapshots` ADD CONSTRAINT `bi_snapshots_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_executive_alerts` ADD CONSTRAINT `bi_executive_alerts_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_exports` ADD CONSTRAINT `bi_exports_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_exports` ADD CONSTRAINT `bi_exports_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `bi_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `bi_exports` ADD CONSTRAINT `bi_exports_exported_by_user_id_fkey` FOREIGN KEY (`exported_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_schedules` ADD CONSTRAINT `bi_schedules_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_schedules` ADD CONSTRAINT `bi_schedules_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `bi_reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bi_schedules` ADD CONSTRAINT `bi_schedules_responsible_user_id_fkey` FOREIGN KEY (`responsible_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
