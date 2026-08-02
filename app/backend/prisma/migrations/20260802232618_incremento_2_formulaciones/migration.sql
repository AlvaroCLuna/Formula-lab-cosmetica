-- CreateTable
CREATE TABLE `raw_material_masters` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `common_name` VARCHAR(191) NOT NULL,
    `inci` VARCHAR(191) NULL,
    `status` ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `raw_material_masters_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `raw_material_masters_organization_id_permanent_code_key`(`organization_id`, `permanent_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formulation_families` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `permanent_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `status` ENUM('activa', 'en_desarrollo', 'archivada', 'obsoleta') NOT NULL DEFAULT 'en_desarrollo',
    `current_version_id` VARCHAR(191) NULL,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `formulation_families_organization_id_idx`(`organization_id`),
    INDEX `formulation_families_created_by_user_id_idx`(`created_by_user_id`),
    UNIQUE INDEX `formulation_families_organization_id_permanent_code_key`(`organization_id`, `permanent_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formulation_versions` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `formulation_family_id` VARCHAR(191) NOT NULL,
    `version_number` INTEGER NOT NULL,
    `status` ENUM('borrador', 'en_revision', 'aprobada', 'rechazada', 'obsoleta') NOT NULL DEFAULT 'borrador',
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `objective` TEXT NULL,
    `notes` TEXT NULL,
    `approved_by_user_id` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `snapshot_json` JSON NULL,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `formulation_versions_organization_id_idx`(`organization_id`),
    INDEX `formulation_versions_formulation_family_id_idx`(`formulation_family_id`),
    INDEX `formulation_versions_created_by_user_id_idx`(`created_by_user_id`),
    UNIQUE INDEX `formulation_versions_formulation_family_id_version_number_key`(`formulation_family_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formulation_ingredients` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `formulation_version_id` VARCHAR(191) NOT NULL,
    `raw_material_master_id` VARCHAR(191) NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `inci` VARCHAR(191) NULL,
    `cosmetic_function` VARCHAR(191) NOT NULL,
    `phase` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `base_quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'g',
    `order_index` INTEGER NOT NULL,
    `source_type` ENUM('materia_prima_maestra', 'provisional') NOT NULL DEFAULT 'provisional',
    `source_reference` VARCHAR(191) NULL,
    `estimated_cost` DOUBLE NULL,
    `production_notes` TEXT NULL,
    `inventory_lock_policy` VARCHAR(191) NULL,
    `status` ENUM('activo', 'inactivo', 'archivado') NOT NULL DEFAULT 'activo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `formulation_ingredients_organization_id_idx`(`organization_id`),
    INDEX `formulation_ingredients_formulation_version_id_idx`(`formulation_version_id`),
    INDEX `formulation_ingredients_raw_material_master_id_idx`(`raw_material_master_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formulation_version_comparisons` (
    `id` VARCHAR(191) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `base_version_id` VARCHAR(191) NOT NULL,
    `target_version_id` VARCHAR(191) NOT NULL,
    `summary_json` JSON NOT NULL,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `formulation_version_comparisons_organization_id_idx`(`organization_id`),
    INDEX `formulation_version_comparisons_base_version_id_idx`(`base_version_id`),
    INDEX `formulation_version_comparisons_target_version_id_idx`(`target_version_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `raw_material_masters` ADD CONSTRAINT `raw_material_masters_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_families` ADD CONSTRAINT `formulation_families_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_families` ADD CONSTRAINT `formulation_families_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_versions` ADD CONSTRAINT `formulation_versions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_versions` ADD CONSTRAINT `formulation_versions_formulation_family_id_fkey` FOREIGN KEY (`formulation_family_id`) REFERENCES `formulation_families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_versions` ADD CONSTRAINT `formulation_versions_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_versions` ADD CONSTRAINT `formulation_versions_approved_by_user_id_fkey` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_ingredients` ADD CONSTRAINT `formulation_ingredients_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_ingredients` ADD CONSTRAINT `formulation_ingredients_formulation_version_id_fkey` FOREIGN KEY (`formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_ingredients` ADD CONSTRAINT `formulation_ingredients_raw_material_master_id_fkey` FOREIGN KEY (`raw_material_master_id`) REFERENCES `raw_material_masters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_version_comparisons` ADD CONSTRAINT `formulation_version_comparisons_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_version_comparisons` ADD CONSTRAINT `formulation_version_comparisons_base_version_id_fkey` FOREIGN KEY (`base_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_version_comparisons` ADD CONSTRAINT `formulation_version_comparisons_target_version_id_fkey` FOREIGN KEY (`target_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formulation_version_comparisons` ADD CONSTRAINT `formulation_version_comparisons_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
