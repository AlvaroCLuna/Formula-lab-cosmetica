CREATE TABLE `entity_types` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(191) NULL,
  `color` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_types_organization_id_code_key`(`organization_id`, `code`),
  INDEX `entity_types_organization_id_idx`(`organization_id`),
  INDEX `entity_types_module_idx`(`module`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `relation_types` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `bidirectional_default` BOOLEAN NOT NULL DEFAULT false,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `relation_types_organization_id_code_key`(`organization_id`, `code`),
  INDEX `relation_types_organization_id_idx`(`organization_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entities` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `entity_type_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `source_entity_type` VARCHAR(191) NOT NULL,
  `source_entity_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `subtitle` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `module` VARCHAR(191) NOT NULL,
  `summary` TEXT NULL,
  `tags_json` JSON NULL,
  `kpis_json` JSON NULL,
  `responsible_user_id` VARCHAR(191) NULL,
  `last_synced_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entities_permanent_code_key`(`permanent_code`),
  UNIQUE INDEX `entities_org_source_key`(`organization_id`, `source_entity_type`, `source_entity_id`),
  INDEX `entities_organization_id_idx`(`organization_id`),
  INDEX `entities_entity_type_id_idx`(`entity_type_id`),
  INDEX `entities_module_idx`(`module`),
  INDEX `entities_title_idx`(`title`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_relations` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `relation_type_id` VARCHAR(191) NOT NULL,
  `from_entity_id` VARCHAR(191) NOT NULL,
  `to_entity_id` VARCHAR(191) NOT NULL,
  `direction` VARCHAR(191) NOT NULL DEFAULT 'directa',
  `weight` DECIMAL(8, 4) NOT NULL DEFAULT 1,
  `valid_from` DATETIME(3) NULL,
  `valid_until` DATETIME(3) NULL,
  `status` ENUM('activa', 'inactiva', 'obsoleta') NOT NULL DEFAULT 'activa',
  `evidence` TEXT NOT NULL,
  `evidence_document_id` VARCHAR(191) NULL,
  `metadata_json` JSON NULL,
  `created_by_user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_relations_permanent_code_key`(`permanent_code`),
  UNIQUE INDEX `entity_rel_org_type_from_to_key`(`organization_id`, `relation_type_id`, `from_entity_id`, `to_entity_id`),
  INDEX `entity_relations_organization_id_idx`(`organization_id`),
  INDEX `entity_relations_from_entity_id_idx`(`from_entity_id`),
  INDEX `entity_relations_to_entity_id_idx`(`to_entity_id`),
  INDEX `entity_relations_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_timeline` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191) NOT NULL,
  `event_at` DATETIME(3) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `module` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `object_type` VARCHAR(191) NOT NULL,
  `object_id` VARCHAR(191) NOT NULL,
  `version` VARCHAR(191) NULL,
  `result` VARCHAR(191) NULL,
  `evidence` TEXT NULL,
  `metadata_json` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_timeline_permanent_code_key`(`permanent_code`),
  INDEX `entity_timeline_organization_id_idx`(`organization_id`),
  INDEX `entity_timeline_entity_id_idx`(`entity_id`),
  INDEX `entity_timeline_module_idx`(`module`),
  INDEX `entity_timeline_event_at_idx`(`event_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_events` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191) NOT NULL,
  `event_type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `severity` VARCHAR(191) NOT NULL DEFAULT 'informativa',
  `source_module` VARCHAR(191) NOT NULL,
  `source_type` VARCHAR(191) NOT NULL,
  `source_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `evidence` TEXT NULL,
  `metadata_json` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_events_permanent_code_key`(`permanent_code`),
  INDEX `entity_events_organization_id_idx`(`organization_id`),
  INDEX `entity_events_entity_id_idx`(`entity_id`),
  INDEX `entity_events_event_type_idx`(`event_type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191) NOT NULL,
  `snapshot_type` VARCHAR(191) NOT NULL,
  `payload_json` JSON NOT NULL,
  `source_json` JSON NOT NULL,
  `captured_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_snapshots_permanent_code_key`(`permanent_code`),
  INDEX `entity_snapshots_organization_id_idx`(`organization_id`),
  INDEX `entity_snapshots_entity_id_idx`(`entity_id`),
  INDEX `entity_snapshots_snapshot_type_idx`(`snapshot_type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_metrics` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191) NOT NULL,
  `metric_key` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `value_json` JSON NOT NULL,
  `source` TEXT NOT NULL,
  `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_metrics_org_entity_metric_key`(`organization_id`, `entity_id`, `metric_key`),
  INDEX `entity_metrics_organization_id_idx`(`organization_id`),
  INDEX `entity_metrics_metric_key_idx`(`metric_key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `entity_views` (
  `id` VARCHAR(191) NOT NULL,
  `organization_id` VARCHAR(191) NOT NULL,
  `permanent_code` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191) NULL,
  `view_kind` ENUM('gemelo', 'grafo', 'arbol', 'timeline', 'tabla', 'tarjetas', 'vista_360') NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `config_json` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'activo',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `entity_views_permanent_code_key`(`permanent_code`),
  INDEX `entity_views_organization_id_idx`(`organization_id`),
  INDEX `entity_views_view_kind_idx`(`view_kind`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `entity_types` ADD CONSTRAINT `entity_types_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relation_types` ADD CONSTRAINT `relation_types_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entities` ADD CONSTRAINT `entities_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entities` ADD CONSTRAINT `entities_entity_type_id_fkey` FOREIGN KEY (`entity_type_id`) REFERENCES `entity_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entities` ADD CONSTRAINT `entities_responsible_user_id_fkey` FOREIGN KEY (`responsible_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_relation_type_id_fkey` FOREIGN KEY (`relation_type_id`) REFERENCES `relation_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_from_entity_id_fkey` FOREIGN KEY (`from_entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_to_entity_id_fkey` FOREIGN KEY (`to_entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_timeline` ADD CONSTRAINT `entity_timeline_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_timeline` ADD CONSTRAINT `entity_timeline_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_timeline` ADD CONSTRAINT `entity_timeline_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `entity_events` ADD CONSTRAINT `entity_events_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_events` ADD CONSTRAINT `entity_events_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_events` ADD CONSTRAINT `entity_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `entity_snapshots` ADD CONSTRAINT `entity_snapshots_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_snapshots` ADD CONSTRAINT `entity_snapshots_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_metrics` ADD CONSTRAINT `entity_metrics_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_metrics` ADD CONSTRAINT `entity_metrics_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_views` ADD CONSTRAINT `entity_views_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `entity_views` ADD CONSTRAINT `entity_views_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
