CREATE TABLE inventory_warehouses (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  code VARCHAR(191) NOT NULL,
  zone VARCHAR(191) NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  responsible_user_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY inventory_warehouses_org_code_unique (organization_id, code),
  KEY inventory_warehouses_organization_id_idx (organization_id),
  CONSTRAINT inventory_warehouses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT inventory_warehouses_responsible_user_id_fkey FOREIGN KEY (responsible_user_id) REFERENCES users(id)
);

CREATE TABLE inventory_locations (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  warehouse_id VARCHAR(191) NOT NULL,
  zone VARCHAR(191) NOT NULL,
  aisle VARCHAR(191) NULL,
  shelf VARCHAR(191) NULL,
  code VARCHAR(191) NOT NULL,
  status ENUM('activo','inactivo','archivado') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY inventory_locations_org_code_unique (organization_id, code),
  KEY inventory_locations_organization_id_idx (organization_id),
  KEY inventory_locations_warehouse_id_idx (warehouse_id),
  CONSTRAINT inventory_locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT inventory_locations_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id)
);

ALTER TABLE raw_material_lots
  MODIFY status ENUM('activo','inactivo','archivado','pendiente_recepcion','recibido','cuarentena','aprobado','rechazado','bloqueado','agotado','caducado') NOT NULL DEFAULT 'pendiente_recepcion';

UPDATE raw_material_lots SET status = 'aprobado' WHERE status = 'activo';
UPDATE raw_material_lots SET status = 'bloqueado' WHERE status = 'inactivo';

ALTER TABLE raw_material_lots
  ADD COLUMN commercial_product_id VARCHAR(191) NULL,
  ADD COLUMN supplier_id VARCHAR(191) NULL,
  ADD COLUMN manufacturer_id VARCHAR(191) NULL,
  ADD COLUMN permanent_code VARCHAR(191) NULL,
  ADD COLUMN supplier_lot_number VARCHAR(191) NULL,
  ADD COLUMN received_at DATETIME(3) NULL,
  ADD COLUMN manufactured_at DATETIME(3) NULL,
  ADD COLUMN expected_quantity DOUBLE NULL,
  ADD COLUMN received_quantity DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN available_quantity DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN reserved_quantity DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN unit VARCHAR(191) NOT NULL DEFAULT 'g',
  ADD COLUMN unit_cost DOUBLE NULL,
  ADD COLUMN currency VARCHAR(191) NOT NULL DEFAULT 'MXN',
  ADD COLUMN exchange_rate DOUBLE NULL,
  ADD COLUMN location_id VARCHAR(191) NULL,
  ADD COLUMN package_intact BOOLEAN NULL,
  ADD COLUMN correct_identification BOOLEAN NULL,
  ADD COLUMN appearance VARCHAR(191) NULL,
  ADD COLUMN color VARCHAR(191) NULL,
  ADD COLUMN odor VARCHAR(191) NULL,
  ADD COLUMN reception_decision VARCHAR(191) NULL,
  ADD COLUMN observations TEXT NULL;

UPDATE raw_material_lots
  SET permanent_code = lot_code
  WHERE permanent_code IS NULL;

ALTER TABLE raw_material_lots
  MODIFY permanent_code VARCHAR(191) NOT NULL,
  MODIFY status ENUM('pendiente_recepcion','recibido','cuarentena','aprobado','rechazado','bloqueado','agotado','caducado','archivado') NOT NULL DEFAULT 'pendiente_recepcion';

CREATE UNIQUE INDEX raw_material_lots_org_permanent_code_unique ON raw_material_lots(organization_id, permanent_code);
CREATE INDEX raw_material_lots_commercial_product_id_idx ON raw_material_lots(commercial_product_id);
CREATE INDEX raw_material_lots_location_id_idx ON raw_material_lots(location_id);

ALTER TABLE raw_material_lots
  ADD CONSTRAINT raw_material_lots_commercial_product_id_fkey FOREIGN KEY (commercial_product_id) REFERENCES raw_material_commercial_products(id),
  ADD CONSTRAINT raw_material_lots_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES raw_material_suppliers(id),
  ADD CONSTRAINT raw_material_lots_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES raw_material_manufacturers(id),
  ADD CONSTRAINT raw_material_lots_location_id_fkey FOREIGN KEY (location_id) REFERENCES inventory_locations(id);

CREATE TABLE inventory_movements (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  lot_id VARCHAR(191) NOT NULL,
  related_movement_id VARCHAR(191) NULL,
  type ENUM('entrada','salida','ajuste_positivo','ajuste_negativo','transferencia','reserva','liberacion_reserva','devolucion','rechazo','merma') NOT NULL,
  quantity DOUBLE NOT NULL,
  unit VARCHAR(191) NOT NULL DEFAULT 'g',
  previous_balance DOUBLE NOT NULL,
  new_balance DOUBLE NOT NULL,
  previous_reserved DOUBLE NOT NULL DEFAULT 0,
  new_reserved DOUBLE NOT NULL DEFAULT 0,
  reason VARCHAR(191) NOT NULL,
  reference VARCHAR(191) NULL,
  document_id VARCHAR(191) NULL,
  from_location_id VARCHAR(191) NULL,
  to_location_id VARCHAR(191) NULL,
  unit_cost DOUBLE NULL,
  currency VARCHAR(191) NULL DEFAULT 'MXN',
  exchange_rate DOUBLE NULL,
  created_by_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY inventory_movements_organization_id_idx (organization_id),
  KEY inventory_movements_lot_id_idx (lot_id),
  KEY inventory_movements_created_by_user_id_idx (created_by_user_id),
  CONSTRAINT inventory_movements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT inventory_movements_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES raw_material_lots(id),
  CONSTRAINT inventory_movements_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT inventory_movements_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id)
);
