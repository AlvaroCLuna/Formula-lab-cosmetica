import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: { name: "Formula Lab Demo", status: "activo" },
    create: { id: "demo-org", name: "Formula Lab Demo", status: "activo" }
  });

  await prisma.user.upsert({
    where: { email: "demo@formulalab.local" },
    update: { fullName: "Usuaria Demo", organizationId: organization.id, status: "activo" },
    create: {
      id: "demo-user",
      organizationId: organization.id,
      email: "demo@formulalab.local",
      passwordHash: await bcrypt.hash("FormulaLab2026!", 10),
      fullName: "Usuaria Demo",
      status: "activo"
    }
  });

  const rawMaterials = [
    ["rm-sci", "MP-00001", "SCI", "Sodium Cocoyl Isethionate", "Tensioactivos", "Anionicos", "Tensioactivo"],
    ["rm-scs", "MP-00002", "SCS", "Sodium Coco Sulfate", "Tensioactivos", "Anionicos", "Tensioactivo"],
    ["rm-sodium-coco-sulfate", "MP-00003", "Sodium Coco Sulfate", "Sodium Coco Sulfate", "Tensioactivos", "Anionicos", "Tensioactivo"],
    ["rm-betaina", "MP-00004", "Cocamidopropyl Betaine", "Cocamidopropyl Betaine", "Tensioactivos", "Anfotericos", "Co-tensioactivo"],
    ["rm-btms", "MP-00005", "BTMS", "Behentrimonium Methosulfate (and) Cetearyl Alcohol", "Acondicionadores", "Cationicos", "Acondicionador"],
    ["rm-cetilico", "MP-00006", "Alcohol Cetilico", "Cetyl Alcohol", "Alcoholes grasos", "Estructurantes", "Co-emulsionante"],
    ["rm-cetearico", "MP-00007", "Alcohol Ceteárico", "Cetearyl Alcohol", "Alcoholes grasos", "Estructurantes", "Co-emulsionante"],
    ["rm-karite", "MP-00008", "Manteca de Karite", "Butyrospermum Parkii Butter", "Lipidos", "Mantecas", "Emoliente"],
    ["rm-argan", "MP-00009", "Aceite de Argan", "Argania Spinosa Kernel Oil", "Lipidos", "Aceites vegetales", "Emoliente"],
    ["rm-coco", "MP-00010", "Aceite de Coco", "Cocos Nucifera Oil", "Lipidos", "Aceites vegetales", "Emoliente"],
    ["rm-glicerina", "MP-00011", "Glicerina", "Glycerin", "Humectantes", "Polioles", "Humectante"],
    ["rm-pantenol", "MP-00012", "Pantenol", "Panthenol", "Activos", "Vitaminas", "Acondicionador"],
    ["rm-proteina", "MP-00013", "Proteina Hidrolizada", "Hydrolyzed Wheat Protein", "Activos", "Proteinas", "Acondicionador"],
    ["rm-arcilla-verde", "MP-00014", "Arcilla Verde", "Illite", "Minerales", "Arcillas", "Absorbente"],
    ["rm-kaolin", "MP-00015", "Arcilla Blanca", "Kaolin", "Minerales", "Arcillas", "Absorbente"],
    ["rm-romero", "MP-00016", "Romero", "Rosmarinus Officinalis Leaf Extract", "Extractos", "Botanicos", "Acondicionador"],
    ["rm-ortiga", "MP-00017", "Ortiga", "Urtica Dioica Extract", "Extractos", "Botanicos", "Acondicionador"],
    ["rm-aloe", "MP-00018", "Aloe Vera", "Aloe Barbadensis Leaf Juice", "Activos", "Botanicos", "Calmante"],
    ["rm-vitamina-e", "MP-00019", "Vitamina E", "Tocopherol", "Activos", "Antioxidantes", "Antioxidante"],
    ["rm-cosgard", "MP-00020", "Cosgard", "Benzyl Alcohol (and) Dehydroacetic Acid", "Conservantes", "Conservantes", "Conservante"],
    ["rm-agua", "MP-00021", "Agua purificada", "Aqua", "Vehiculos", "Acuosos", "Vehiculo"],
    ["rm-xantana", "MP-00022", "Goma Xantana", "Xanthan Gum", "Gelificantes", "Gomas", "Modificador reologico"],
    ["rm-olivem", "MP-00023", "Olivem 1000", "Cetearyl Olivate (and) Sorbitan Olivate", "Emulsionantes", "No ionicos", "Emulsionante"],
    ["rm-emulsifying-wax", "MP-00024", "Cera emulsionante", "Cetearyl Alcohol (and) Polysorbate 60", "Emulsionantes", "No ionicos", "Emulsionante"],
    ["rm-acido-estearico", "MP-00025", "Acido estearico", "Stearic Acid", "Estructurantes", "Acidos grasos", "Estructurante"],
    ["rm-niacinamida", "MP-00026", "Niacinamida", "Niacinamide", "Activos", "Vitaminas", "Acondicionador cutaneo"],
    ["rm-acido-hialuronico", "MP-00027", "Acido hialuronico", "Sodium Hyaluronate", "Activos", "Humectantes", "Humectante"],
    ["rm-miel", "MP-00028", "Miel", "Mel", "Activos", "Naturales", "Humectante"],
    ["rm-carbon-activado", "MP-00029", "Carbon activado", "Charcoal Powder", "Minerales", "Polvos", "Absorbente"],
    ["rm-aceite-ricino", "MP-00030", "Aceite de Ricino", "Ricinus Communis Seed Oil", "Lipidos", "Aceites vegetales", "Emoliente"]
  ].map(([id, permanentCode, commonName, inci, category, family, cosmeticFunction]) => ({ id, permanentCode, commonName, inci, category, family, cosmeticFunction }));

  for (const material of rawMaterials) {
    await prisma.rawMaterialMaster.upsert({
      where: { id: material.id },
      update: { permanentCode: material.permanentCode, commonName: material.commonName, inci: material.inci, category: material.category, family: material.family, cosmeticFunction: material.cosmeticFunction, status: "validada", currentVersionId: `${material.id}-v1` },
      create: { ...material, organizationId: organization.id, status: "validada", currentVersionId: `${material.id}-v1`, createdByUserId: "demo-user" }
    });
    await prisma.rawMaterialMasterVersion.upsert({
      where: { rawMaterialMasterId_versionNumber: { rawMaterialMasterId: material.id, versionNumber: 1 } },
      update: {
        commonName: material.commonName,
        inci: material.inci,
        category: material.category,
        family: material.family,
        cosmeticFunction: material.cosmeticFunction,
        status: "validada"
      },
      create: {
        id: `${material.id}-v1`,
        organizationId: organization.id,
        rawMaterialMasterId: material.id,
        versionNumber: 1,
        status: "validada",
        commercialName: material.commonName,
        commonName: material.commonName,
        inci: material.inci,
        category: material.category,
        family: material.family,
        cosmeticFunction: material.cosmeticFunction,
        description: `Ficha demo de ${material.commonName}. Informacion base para validar el modulo de conocimiento; requiere evidencia documental real antes de uso tecnico definitivo.`,
        appearance: "Informacion pendiente de documento tecnico",
        color: "Informacion pendiente de documento tecnico",
        odor: "Informacion pendiente de documento tecnico",
        solubility: "Informacion pendiente de documento tecnico",
        usageRange: "Informacion pendiente de documento tecnico",
        storageConditions: "Conservar segun ficha tecnica del proveedor.",
        shelfLife: "Informacion pendiente de documento tecnico",
        contraindications: "Informacion insuficiente para evaluar.",
        compatibilities: "Informacion insuficiente para evaluar.",
        incompatibilities: "Informacion insuficiente para evaluar.",
        allergens: "Informacion insuficiente para evaluar.",
        observations: "Dato demo. No sustituye SDS, TDS ni COA.",
        examplesOfUse: "Formulaciones cosmeticas donde su funcion declarada sea aplicable y exista validacion tecnica.",
        evidenceSummary: "Seed demo sin documento fuente adjunto.",
        confidenceLevel: "demo",
        approvedByUserId: "demo-user",
        approvedAt: new Date("2026-08-02T12:00:00.000Z"),
        snapshotJson: { seed: true, commonName: material.commonName, inci: material.inci },
        createdByUserId: "demo-user"
      }
    });
    await prisma.rawMaterialSupplier.upsert({
      where: { id: `${material.id}-supplier` },
      update: { name: "Proveedor demo", status: "activo" },
      create: { id: `${material.id}-supplier`, organizationId: organization.id, rawMaterialMasterId: material.id, name: "Proveedor demo", contact: "Pendiente" }
    });
    await prisma.rawMaterialManufacturer.upsert({
      where: { id: `${material.id}-manufacturer` },
      update: { name: "Fabricante demo", status: "activo" },
      create: { id: `${material.id}-manufacturer`, organizationId: organization.id, rawMaterialMasterId: material.id, name: "Fabricante demo", country: "MX" }
    });
    await prisma.rawMaterialCommercialProduct.upsert({
      where: { id: `${material.id}-product` },
      update: {
        permanentCode: `PC-${material.permanentCode}`,
        manufacturerId: `${material.id}-manufacturer`,
        supplierId: `${material.id}-supplier`,
        tradeName: material.commonName,
        presentation: "Bolsa",
        presentationQuantity: material.id.includes("agua") ? 20 : 1,
        unit: material.id.includes("agua") ? "l" : "kg",
        price: material.id.includes("argan") || material.id.includes("hialuronico") ? 28 : 240 + material.permanentCode.length * 7,
        taxRate: 16,
        shippingCost: 35,
        minimumPurchase: 1,
        priceValidUntil: new Date("2026-12-31T00:00:00.000Z"),
        quotedAt: new Date("2026-08-01T00:00:00.000Z"),
        status: "activo",
        currency: material.id.includes("argan") || material.id.includes("hialuronico") ? "USD" : "MXN"
      },
      create: {
        id: `${material.id}-product`,
        organizationId: organization.id,
        rawMaterialMasterId: material.id,
        manufacturerId: `${material.id}-manufacturer`,
        supplierId: `${material.id}-supplier`,
        permanentCode: `PC-${material.permanentCode}`,
        tradeName: material.commonName,
        presentation: "Bolsa",
        presentationQuantity: material.id.includes("agua") ? 20 : 1,
        unit: material.id.includes("agua") ? "l" : "kg",
        price: material.id.includes("argan") || material.id.includes("hialuronico") ? 28 : 240 + material.permanentCode.length * 7,
        taxRate: 16,
        shippingCost: 35,
        minimumPurchase: 1,
        priceValidUntil: new Date("2026-12-31T00:00:00.000Z"),
        quotedAt: new Date("2026-08-01T00:00:00.000Z"),
        averageCost: material.id.includes("argan") || material.id.includes("hialuronico") ? 28 : 240 + material.permanentCode.length * 7,
        currency: material.id.includes("argan") || material.id.includes("hialuronico") ? "USD" : "MXN"
      }
    });
    await prisma.rawMaterialPriceHistory.upsert({
      where: { id: `${material.id}-price-1` },
      update: { newPrice: material.id.includes("argan") || material.id.includes("hialuronico") ? 28 : 240 + material.permanentCode.length * 7 },
      create: {
        id: `${material.id}-price-1`,
        organizationId: organization.id,
        commercialProductId: `${material.id}-product`,
        supplierId: `${material.id}-supplier`,
        previousPrice: null,
        newPrice: material.id.includes("argan") || material.id.includes("hialuronico") ? 28 : 240 + material.permanentCode.length * 7,
        currency: material.id.includes("argan") || material.id.includes("hialuronico") ? "USD" : "MXN",
        taxRate: 16,
        shippingCost: 35,
        validUntil: new Date("2026-12-31T00:00:00.000Z"),
        quotedAt: new Date("2026-08-01T00:00:00.000Z"),
        reason: "Seed demo Incremento 5",
        evidenceReference: "Cotizacion demo",
        createdByUserId: "demo-user"
      }
    });
    await prisma.rawMaterialDocument.upsert({
      where: { id: `${material.id}-doc` },
      update: { title: `Ficha pendiente ${material.commonName}`, status: "activo" },
      create: { id: `${material.id}-doc`, organizationId: organization.id, rawMaterialMasterId: material.id, title: `Ficha pendiente ${material.commonName}`, documentType: "tds", externalReference: "Documento demo pendiente de carga" }
    });
  }

  const warehouses = [
    ["wh-central", "ALM-CENTRAL", "Almacen central", "Recepcion y stock general"],
    ["wh-lab", "ALM-LAB", "Almacen laboratorio", "Pruebas y muestras"]
  ] as const;

  for (const [id, code, name, zone] of warehouses) {
    await prisma.inventoryWarehouse.upsert({
      where: { id },
      update: { code, name, zone, status: "activo", responsibleUserId: "demo-user" },
      create: { id, organizationId: organization.id, code, name, zone, status: "activo", responsibleUserId: "demo-user" }
    });
  }

  const locations = [
    ["loc-a1", "wh-central", "A", "01", "E1", "CENT-A1-E1"],
    ["loc-a2", "wh-central", "A", "02", "E1", "CENT-A2-E1"],
    ["loc-b1", "wh-central", "B", "01", "E2", "CENT-B1-E2"],
    ["loc-b2", "wh-central", "B", "02", "E2", "CENT-B2-E2"],
    ["loc-q1", "wh-central", "Cuarentena", "Q", "E1", "CENT-Q1"],
    ["loc-frio", "wh-central", "Frio", "F", "E1", "CENT-FRIO"],
    ["loc-lab-01", "wh-lab", "Laboratorio", "01", "Mesa", "LAB-01"],
    ["loc-lab-02", "wh-lab", "Laboratorio", "02", "Mesa", "LAB-02"]
  ] as const;

  for (const [id, warehouseId, zone, aisle, shelf, code] of locations) {
    await prisma.inventoryLocation.upsert({
      where: { id },
      update: { warehouseId, zone, aisle, shelf, code, status: "activo" },
      create: { id, organizationId: organization.id, warehouseId, zone, aisle, shelf, code, status: "activo" }
    });
  }

  const lotStatuses = ["aprobado", "aprobado", "aprobado", "cuarentena", "bloqueado", "rechazado", "caducado", "recibido"] as const;
  const locationIds = locations.map(([id]) => id);
  const inventoryMaterials = rawMaterials.slice(0, 25);
  for (const [index, material] of inventoryMaterials.entries()) {
    const status = lotStatuses[index % lotStatuses.length];
    const lotId = `lot-demo-${String(index + 1).padStart(2, "0")}`;
    const receivedQuantity = 1000 + index * 75;
    const reservedQuantity = index % 6 === 0 && status === "aprobado" ? 120 : 0;
    const availableQuantity = status === "agotado" ? 0 : Math.max(receivedQuantity - reservedQuantity - (status === "rechazado" ? receivedQuantity : 0), 0);
    const expirationDate = status === "caducado"
      ? new Date("2026-01-15T00:00:00.000Z")
      : index % 5 === 0
        ? new Date("2026-09-20T00:00:00.000Z")
        : new Date(`2027-${String((index % 9) + 1).padStart(2, "0")}-15T00:00:00.000Z`);
    const locationId = status === "cuarentena" ? "loc-q1" : locationIds[index % locationIds.length];
    const unitCost = material.id.includes("argan") ? 9.8 : Math.round((0.18 + index * 0.035) * 100) / 100;
    const currency = material.id.includes("argan") ? "USD" : "MXN";

    await prisma.rawMaterialLot.upsert({
      where: { id: lotId },
      update: {
        commercialProductId: `${material.id}-product`,
        supplierId: `${material.id}-supplier`,
        manufacturerId: `${material.id}-manufacturer`,
        locationId,
        status,
        receivedQuantity,
        availableQuantity,
        reservedQuantity,
        expirationDate,
        unitCost,
        currency
      },
      create: {
        id: lotId,
        organizationId: organization.id,
        rawMaterialMasterId: material.id,
        commercialProductId: `${material.id}-product`,
        supplierId: `${material.id}-supplier`,
        manufacturerId: `${material.id}-manufacturer`,
        permanentCode: `LOT-${String(index + 1).padStart(5, "0")}`,
        lotCode: `LOT-${String(index + 1).padStart(5, "0")}`,
        supplierLotNumber: `PROV-${String(index + 1).padStart(4, "0")}`,
        receivedAt: new Date("2026-08-02T09:00:00.000Z"),
        manufacturedAt: new Date("2026-06-15T00:00:00.000Z"),
        expirationDate,
        expectedQuantity: receivedQuantity,
        receivedQuantity,
        availableQuantity,
        reservedQuantity,
        unit: material.id.includes("agua") ? "l" : "g",
        unitCost,
        currency,
        exchangeRate: currency === "USD" ? 18.5 : 1,
        locationId,
        status,
        packageIntact: status !== "rechazado",
        correctIdentification: status !== "rechazado",
        appearance: "Conforme a recepcion visual demo",
        color: "Segun especificacion demo",
        odor: "Caracteristico",
        receptionDecision: status === "rechazado" ? "Rechazar" : status === "cuarentena" ? "Mantener en cuarentena" : "Liberar",
        observations: "Lote demo para validar kardex, FEFO, reservas y alertas. No sustituye COA/SDS/TDS."
      }
    });

    await prisma.inventoryMovement.upsert({
      where: { id: `${lotId}-entrada` },
      update: { quantity: receivedQuantity, newBalance: receivedQuantity, unitCost, currency },
      create: {
        id: `${lotId}-entrada`,
        organizationId: organization.id,
        lotId,
        type: "entrada",
        quantity: receivedQuantity,
        unit: material.id.includes("agua") ? "l" : "g",
        previousBalance: 0,
        newBalance: receivedQuantity,
        previousReserved: 0,
        newReserved: 0,
        reason: "Recepcion documental demo",
        reference: "COA/SDS/TDS demo",
        toLocationId: locationId,
        unitCost,
        currency,
        exchangeRate: currency === "USD" ? 18.5 : 1,
        createdByUserId: "demo-user"
      }
    });

    if (reservedQuantity > 0) {
      await prisma.inventoryMovement.upsert({
        where: { id: `${lotId}-reserva` },
        update: { quantity: reservedQuantity, newBalance: availableQuantity, newReserved: reservedQuantity },
        create: {
          id: `${lotId}-reserva`,
          organizationId: organization.id,
          lotId,
          type: "reserva",
          quantity: reservedQuantity,
          unit: "g",
          previousBalance: receivedQuantity,
          newBalance: availableQuantity,
          previousReserved: 0,
          newReserved: reservedQuantity,
          reason: "Reserva demo para formulacion futura",
          reference: "REQ-DEMO-001",
          fromLocationId: locationId,
          createdByUserId: "demo-user"
        }
      });
    }
  }

  await prisma.inventoryMovement.upsert({
    where: { id: "lot-demo-02-transfer-out" },
    update: { relatedMovementId: "lot-demo-02-transfer-in" },
    create: {
      id: "lot-demo-02-transfer-out",
      organizationId: organization.id,
      lotId: "lot-demo-02",
      type: "salida",
      quantity: 50,
      unit: "g",
      previousBalance: 1075,
      newBalance: 1025,
      reason: "Transferencia demo entre ubicaciones",
      reference: "TR-DEMO-001",
      fromLocationId: "loc-a2",
      toLocationId: "loc-lab-01",
      relatedMovementId: "lot-demo-02-transfer-in",
      createdByUserId: "demo-user"
    }
  });

  await prisma.inventoryMovement.upsert({
    where: { id: "lot-demo-02-transfer-in" },
    update: { relatedMovementId: "lot-demo-02-transfer-out" },
    create: {
      id: "lot-demo-02-transfer-in",
      organizationId: organization.id,
      lotId: "lot-demo-02",
      type: "entrada",
      quantity: 50,
      unit: "g",
      previousBalance: 1025,
      newBalance: 1075,
      reason: "Transferencia demo entre ubicaciones",
      reference: "TR-DEMO-001",
      fromLocationId: "loc-a2",
      toLocationId: "loc-lab-01",
      relatedMovementId: "lot-demo-02-transfer-out",
      createdByUserId: "demo-user"
    }
  });

  await prisma.rawMaterialLot.update({ where: { id: "lot-demo-02" }, data: { locationId: "loc-lab-01" } });

  const family = await prisma.formulationFamily.upsert({
    where: { organizationId_permanentCode: { organizationId: organization.id, permanentCode: "FLC-FRM-000001" } },
    update: {
      name: "Shampoo solido nutritivo",
      category: "Cuidado capilar",
      status: "activa",
      currentVersionId: "frm-shampoo-v1"
    },
    create: {
      id: "frm-shampoo-family",
      organizationId: organization.id,
      permanentCode: "FLC-FRM-000001",
      name: "Shampoo solido nutritivo",
      category: "Cuidado capilar",
      status: "activa",
      currentVersionId: "frm-shampoo-v1",
      createdByUserId: "demo-user"
    }
  });

  await prisma.formulationVersion.upsert({
    where: { formulationFamilyId_versionNumber: { formulationFamilyId: family.id, versionNumber: 1 } },
    update: {
      status: "aprobada",
      name: family.name,
      category: family.category,
      approvedByUserId: "demo-user",
      approvedAt: new Date("2026-08-02T12:00:00.000Z")
    },
    create: {
      id: "frm-shampoo-v1",
      organizationId: organization.id,
      formulationFamilyId: family.id,
      versionNumber: 1,
      status: "aprobada",
      name: family.name,
      category: family.category,
      objective: "Formula demo aprobada para validar versionado.",
      notes: "Datos demo sin recomendacion tecnica automatica.",
      approvedByUserId: "demo-user",
      approvedAt: new Date("2026-08-02T12:00:00.000Z"),
      createdByUserId: "demo-user"
    }
  });

  for (const [name, orderIndex] of [["A", 1], ["B", 2], ["C", 3]] as const) {
    await prisma.formulationPhase.upsert({
      where: { formulationVersionId_name: { formulationVersionId: "frm-shampoo-v1", name } },
      update: { orderIndex },
      create: { id: `frm-shampoo-v1-phase-${name}`, organizationId: organization.id, formulationVersionId: "frm-shampoo-v1", name, orderIndex }
    });
  }

  const demoIngredients = [
    ["ing-sci", "rm-sci", "SCI", "Sodium Cocoyl Isethionate", "Tensioactivo", "A", 45, 45, 1],
    ["ing-betaina", "rm-betaina", "Betaina de coco", "Cocamidopropyl Betaine", "Co-tensioactivo", "A", 10, 10, 2],
    ["ing-karite", "rm-karite", "Manteca de karite", "Butyrospermum Parkii Butter", "Emoliente", "B", 8, 8, 3],
    ["ing-jojoba", "rm-jojoba", "Aceite de jojoba", "Simmondsia Chinensis Seed Oil", "Emoliente", "B", 5, 5, 4],
    ["ing-kaolin", "rm-kaolin", "Arcilla blanca", "Kaolin", "Absorbente", "C", 20, 20, 5],
    ["ing-pantenol", "rm-pantenol", "Pantenol", "Panthenol", "Acondicionador", "C", 2, 2, 6],
    ["ing-agua", "rm-agua", "Agua purificada", "Aqua", "Vehiculo", "A", 10, 10, 7]
  ] as const;

  for (const [id, rawMaterialMasterId, displayName, inci, cosmeticFunction, phase, percentage, baseQuantity, orderIndex] of demoIngredients) {
    await prisma.formulationIngredient.upsert({
      where: { id },
      update: {
        displayName,
        inci,
        cosmeticFunction,
        phase,
        percentage,
        baseQuantity,
        orderIndex,
        status: "activo"
      },
      create: {
        id,
        organizationId: organization.id,
        formulationVersionId: "frm-shampoo-v1",
        rawMaterialMasterId,
        displayName,
        inci,
        cosmeticFunction,
        phase,
        percentage,
        baseQuantity,
        unit: "g",
        orderIndex,
        sourceType: "materia_prima_maestra",
        sourceReference: rawMaterials.find((material) => material.id === rawMaterialMasterId)?.permanentCode,
        status: "activo"
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
