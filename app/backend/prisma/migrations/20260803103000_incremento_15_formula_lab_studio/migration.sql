-- Incremento 15 - Formula Lab Studio / Visual Workflow Engine + BPM
-- Migracion acotada a tablas Studio. No modifica modulos aprobados.

CREATE TABLE `workflow_categories` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',

    INDEX `workflow_categories_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `workflow_categories_organization_id_code_key`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `module_scope` VARCHAR(191) NOT NULL DEFAULT 'transversal',
    `status` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `current_version_id` VARCHAR(191) NULL,
    `author_user_id` VARCHAR(191) NOT NULL,
    `tags_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `workflow_definitions_permanent_code_key`(`permanent_code`),
    INDEX `workflow_definitions_organization_id_idx`(`organization_id`),
    INDEX `workflow_definitions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_versions` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_definition_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `version_number` INTEGER NOT NULL,
    `status` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `canvas_json` JSON NOT NULL,
    `config_json` JSON NOT NULL,
    `validation_json` JSON NULL,
    `comments` TEXT NULL,
    `author_user_id` VARCHAR(191) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `workflow_versions_permanent_code_key`(`permanent_code`),
    INDEX `workflow_versions_organization_id_idx`(`organization_id`),
    INDEX `workflow_versions_status_idx`(`status`),
    UNIQUE INDEX `workflow_versions_workflow_definition_id_version_number_key`(`workflow_definition_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_nodes` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_version_id` VARCHAR(191) NOT NULL,
    `node_key` VARCHAR(191) NOT NULL,
    `node_type` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `position_x` DOUBLE NOT NULL DEFAULT 0,
    `position_y` DOUBLE NOT NULL DEFAULT 0,
    `config_json` JSON NOT NULL,
    `group_key` VARCHAR(191) NULL,

    INDEX `workflow_nodes_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `workflow_nodes_workflow_version_id_node_key_key`(`workflow_version_id`, `node_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_edges` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_version_id` VARCHAR(191) NOT NULL,
    `edge_key` VARCHAR(191) NOT NULL,
    `from_node_key` VARCHAR(191) NOT NULL,
    `to_node_key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `condition_json` JSON NULL,

    INDEX `workflow_edges_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `workflow_edges_workflow_version_id_edge_key_key`(`workflow_version_id`, `edge_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_instances` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `workflow_definition_id` VARCHAR(191) NOT NULL,
    `workflow_version_id` VARCHAR(191) NOT NULL,
    `current_node_key` VARCHAR(191) NULL,
    `status` ENUM('pendiente', 'en_proceso', 'completada', 'fallida', 'cancelada') NOT NULL DEFAULT 'pendiente',
    `entity_type` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `input_json` JSON NULL,
    `output_json` JSON NULL,
    `error_message` TEXT NULL,
    `started_by_user_id` VARCHAR(191) NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,

    UNIQUE INDEX `workflow_instances_permanent_code_key`(`permanent_code`),
    INDEX `workflow_instances_organization_id_idx`(`organization_id`),
    INDEX `workflow_instances_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_events` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `workflow_definition_id` VARCHAR(191) NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `module_scope` VARCHAR(191) NOT NULL,
    `trigger_config_json` JSON NOT NULL,
    `action_config_json` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `workflow_events_permanent_code_key`(`permanent_code`),
    INDEX `workflow_events_organization_id_idx`(`organization_id`),
    INDEX `workflow_events_event_type_idx`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_variables` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `data_type` VARCHAR(191) NOT NULL,
    `default_value_json` JSON NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `workflow_variables_permanent_code_key`(`permanent_code`),
    INDEX `workflow_variables_organization_id_idx`(`organization_id`),
    INDEX `workflow_variables_scope_idx`(`scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dynamic_forms` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `current_version_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `dynamic_forms_permanent_code_key`(`permanent_code`),
    INDEX `dynamic_forms_organization_id_idx`(`organization_id`),
    INDEX `dynamic_forms_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dynamic_form_fields` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `form_id` VARCHAR(191) NOT NULL,
    `field_key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `field_type` VARCHAR(191) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `options_json` JSON NULL,
    `validation_json` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `dynamic_form_fields_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `dynamic_form_fields_form_id_field_key_key`(`form_id`, `field_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dynamic_form_versions` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `form_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `version_number` INTEGER NOT NULL,
    `schema_json` JSON NOT NULL,
    `status` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `published_at` DATETIME(3) NULL,

    UNIQUE INDEX `dynamic_form_versions_permanent_code_key`(`permanent_code`),
    INDEX `dynamic_form_versions_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `dynamic_form_versions_form_id_version_number_key`(`form_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklists` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `module_scope` VARCHAR(191) NOT NULL DEFAULT 'transversal',
    `status` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',

    UNIQUE INDEX `checklists_permanent_code_key`(`permanent_code`),
    INDEX `checklists_organization_id_idx`(`organization_id`),
    INDEX `checklists_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklist_items` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `checklist_id` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `response_type` VARCHAR(191) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `config_json` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `checklist_items_organization_id_idx`(`organization_id`),
    INDEX `checklist_items_checklist_id_idx`(`checklist_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_templates` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `workflow_version_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `template_type` VARCHAR(191) NOT NULL,
    `payload_json` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `workflow_templates_permanent_code_key`(`permanent_code`),
    INDEX `workflow_templates_organization_id_idx`(`organization_id`),
    INDEX `workflow_templates_template_type_idx`(`template_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_execution_log` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_instance_id` VARCHAR(191) NOT NULL,
    `node_key` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `duration_ms` INTEGER NULL,
    `error_message` TEXT NULL,
    `user_id` VARCHAR(191) NULL,
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `workflow_execution_log_organization_id_idx`(`organization_id`),
    INDEX `workflow_execution_log_workflow_instance_id_idx`(`workflow_instance_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_definition_id` VARCHAR(191) NOT NULL,
    `role_or_user` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'activo',

    INDEX `workflow_permissions_organization_id_idx`(`organization_id`),
    INDEX `workflow_permissions_workflow_definition_id_idx`(`workflow_definition_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_marketplace` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `workflow_definition_id` VARCHAR(191) NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `item_type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `payload_json` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'interno',

    UNIQUE INDEX `workflow_marketplace_permanent_code_key`(`permanent_code`),
    INDEX `workflow_marketplace_organization_id_idx`(`organization_id`),
    INDEX `workflow_marketplace_item_type_idx`(`item_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workflow_categories` ADD CONSTRAINT `workflow_categories_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_definitions` ADD CONSTRAINT `workflow_definitions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_definitions` ADD CONSTRAINT `workflow_definitions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `workflow_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_definitions` ADD CONSTRAINT `workflow_definitions_author_user_id_fkey` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_versions` ADD CONSTRAINT `workflow_versions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_versions` ADD CONSTRAINT `workflow_versions_workflow_definition_id_fkey` FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_versions` ADD CONSTRAINT `workflow_versions_author_user_id_fkey` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_nodes` ADD CONSTRAINT `workflow_nodes_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_nodes` ADD CONSTRAINT `workflow_nodes_workflow_version_id_fkey` FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_edges` ADD CONSTRAINT `workflow_edges_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_edges` ADD CONSTRAINT `workflow_edges_workflow_version_id_fkey` FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `workflow_instances_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `workflow_instances_workflow_definition_id_fkey` FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `workflow_instances_workflow_version_id_fkey` FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `workflow_instances_started_by_user_id_fkey` FOREIGN KEY (`started_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_events` ADD CONSTRAINT `workflow_events_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_events` ADD CONSTRAINT `workflow_events_workflow_definition_id_fkey` FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_variables` ADD CONSTRAINT `workflow_variables_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dynamic_forms` ADD CONSTRAINT `dynamic_forms_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dynamic_form_fields` ADD CONSTRAINT `dynamic_form_fields_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dynamic_form_fields` ADD CONSTRAINT `dynamic_form_fields_form_id_fkey` FOREIGN KEY (`form_id`) REFERENCES `dynamic_forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dynamic_form_versions` ADD CONSTRAINT `dynamic_form_versions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dynamic_form_versions` ADD CONSTRAINT `dynamic_form_versions_form_id_fkey` FOREIGN KEY (`form_id`) REFERENCES `dynamic_forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists` ADD CONSTRAINT `checklists_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklist_items` ADD CONSTRAINT `checklist_items_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklist_items` ADD CONSTRAINT `checklist_items_checklist_id_fkey` FOREIGN KEY (`checklist_id`) REFERENCES `checklists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_templates` ADD CONSTRAINT `workflow_templates_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_templates` ADD CONSTRAINT `workflow_templates_workflow_version_id_fkey` FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_execution_log` ADD CONSTRAINT `workflow_execution_log_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_execution_log` ADD CONSTRAINT `workflow_execution_log_workflow_instance_id_fkey` FOREIGN KEY (`workflow_instance_id`) REFERENCES `workflow_instances`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_execution_log` ADD CONSTRAINT `workflow_execution_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_permissions` ADD CONSTRAINT `workflow_permissions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_permissions` ADD CONSTRAINT `workflow_permissions_workflow_definition_id_fkey` FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_marketplace` ADD CONSTRAINT `workflow_marketplace_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_marketplace` ADD CONSTRAINT `workflow_marketplace_workflow_definition_id_fkey` FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

