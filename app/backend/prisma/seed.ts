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

  const knowledgeFamilies = [
    ["kf-tensioactivos", "KF-TENS", "Sistemas tensioactivos", "Sistemas que limpian usando tensioactivos y agua."],
    ["kf-emulsiones", "KF-EMUL", "Emulsiones", "Mezclas estables de fase acuosa y oleosa."],
    ["kf-anhidros", "KF-ANHI", "Sistemas anhidros", "Productos sin agua libre basados en aceites, mantecas o ceras."],
    ["kf-geles", "KF-GEL", "Geles", "Sistemas con viscosidad construida por polimeros, gomas o gelificantes."],
    ["kf-soluciones", "KF-SOL", "Soluciones", "Mezclas homogeneas donde los componentes estan disueltos."],
    ["kf-suspensiones", "KF-SUSP", "Suspensiones", "Sistemas con particulas dispersas que no se disuelven totalmente."],
    ["kf-dispersiones", "KF-DISP", "Dispersiones", "Sistemas donde una fase se distribuye en otra sin formar solucion completa."],
    ["kf-solidos", "KF-SOLID", "Sistemas solidos compactos", "Productos solidos compactados o moldeados."],
    ["kf-efervescentes", "KF-EFER", "Sistemas efervescentes", "Solidos que liberan gas al contacto con agua."],
    ["kf-perfumeria", "KF-PERF", "Perfumeria y sistemas hidroalcoholicos", "Sistemas aromaticos en alcohol, agua o solubilizantes."],
    ["kf-extractivas", "KF-EXT", "Preparaciones extractivas", "Preparaciones obtenidas por contacto entre material vegetal y solvente."],
    ["kf-cerosos", "KF-CERA", "Sistemas cerosos", "Sistemas estructurados con ceras, aceites y mantecas."],
    ["kf-limpieza", "KF-LIMP", "Productos de limpieza", "Sistemas para limpieza domestica o higiene no cosmetica futura."],
    ["kf-decorativos", "KF-DECO", "Productos decorativos futuros", "Base conceptual para maquillaje y color cosmetico."]
  ] as const;

  for (const [id, code, name, simpleDefinition] of knowledgeFamilies) {
    await prisma.knowledgeFormulationFamily.upsert({
      where: { id },
      update: { code, name, simpleDefinition, status: "activo" },
      create: {
        id,
        code,
        name,
        simpleDefinition,
        technicalDefinition: "Contenido educativo registrado. No sustituye procedimiento tecnico validado.",
        typicalStructure: "Ingredientes funcionales, vehiculo o fase base, modificadores, controles y documentacion.",
        usualIngredientsJson: ["Agua", "Aceites", "Tensioactivos", "Modificadores reologicos", "Conservantes"],
        advantagesJson: ["Permite ubicar productos por tecnologia", "Facilita aprendizaje progresivo"],
        limitationsJson: ["Requiere validacion tecnica antes de fabricar"],
        difficulty: ["kf-efervescentes", "kf-decorativos"].includes(id) ? "Avanzado" : "Intermedio",
        commonEquipmentJson: ["Bascula", "Agitador", "Vaso de proceso", "Termometro"],
        basicControlsJson: ["pH", "Viscosidad", "Apariencia", "Estabilidad"],
        frequentRisksJson: ["Separacion", "pH fuera de rango", "Contaminacion"],
        relatedTermsJson: [name],
        internalReferencesJson: ["Formula Engine", "Materias Primas Maestras", "Produccion"]
      }
    });
  }

  const subfamilies = [
    ["ksf-solido-compacto", "kf-tensioactivos", "KSF-SOLID-COMP", "Solido compactado"],
    ["ksf-emulsion-ow", "kf-emulsiones", "KSF-OW", "Emulsion O/W"],
    ["ksf-balsamo-anhidro", "kf-anhidros", "KSF-BALM", "Balsamo anhidro"]
  ] as const;
  for (const [id, familyId, code, name] of subfamilies) {
    await prisma.formulationSubfamily.upsert({ where: { id }, update: { name }, create: { id, familyId, code, name, description: "Subfamilia educativa registrada para navegacion del Centro de Conocimiento." } });
  }

  const categoryProducts = [
    ["cat-capilar", "Capilar", ["Shampoo solido", "Shampoo liquido", "Shampoo anticaspa", "Shampoo hidratante", "Shampoo para cabello graso", "Shampoo infantil", "Shampoo sin sulfatos", "Acondicionador solido", "Acondicionador liquido", "Leave-in", "Mascarilla capilar", "Serum capilar", "Protector termico", "Activador de rizos", "Spray desenredante", "Aceite capilar", "Gel fijador", "Cera", "Pomada", "Crema para peinar", "Espuma", "Spray fijador"]],
    ["cat-jabones", "Jabones y limpieza", ["Jabon solido", "Jabon liquido", "Syndet", "Limpiador facial", "Limpiador corporal", "Limpiador intimo", "Exfoliante", "Gel de bano"]],
    ["cat-facial", "Facial", ["Agua micelar", "Tonico", "Serum", "Crema facial", "Contorno de ojos", "Exfoliante facial", "Mascarilla", "Balsamo facial", "Protector solar"]],
    ["cat-corporal", "Corporal", ["Crema corporal", "Locion", "Manteca corporal", "Aceite corporal", "Gel corporal", "Exfoliante corporal", "Mousse corporal", "After sun"]],
    ["cat-manos-pies", "Manos y pies", ["Crema para manos", "Crema para pies", "Balsamo", "Exfoliante", "Aceite para cuticula"]],
    ["cat-higiene", "Higiene personal", ["Desodorante solido", "Desodorante roll-on", "Desodorante spray", "Pasta dental", "Enjuague bucal", "Gel antibacterial"]],
    ["cat-afeitado", "Afeitado", ["Crema de afeitar", "Jabon de afeitar", "Aceite de afeitar", "After shave", "Balsamo postafeitado"]],
    ["cat-labios", "Labios", ["Balsamo labial", "Exfoliante labial", "Protector labial", "Gloss"]],
    ["cat-bebes", "Bebes", ["Shampoo infantil", "Jabon infantil", "Crema infantil", "Pomada", "Aceite infantil"]],
    ["cat-spa", "Spa", ["Sales de bano", "Bombas efervescentes", "Mascarillas", "Arcillas", "Envolturas"]],
    ["cat-perfumeria", "Perfumeria", ["Perfume", "Eau de toilette", "Eau de parfum", "Splash corporal", "Bruma corporal"]],
    ["cat-aromaterapia", "Aromaterapia y hogar", ["Roll-on aromatico", "Bruma ambiental", "Spray ambiental", "Difusor", "Vela aromatica", "Wax melts"]],
    ["cat-bases", "Bases y preparaciones", ["Base de shampoo", "Base de acondicionador", "Base de crema", "Base de gel", "Base de locion", "Extracto", "Macerado", "Oleato", "Hidrolato", "Tintura", "Fermento", "Infusion"]]
  ] as const;

  const productIdByName = new Map<string, string>();
  const slugOf = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const [categoryId, categoryName, products] of categoryProducts) {
    await prisma.productCategory.upsert({ where: { id: categoryId }, update: { name: categoryName }, create: { id: categoryId, code: categoryId.replace("cat-", "CAT-").toUpperCase(), name: categoryName, description: `Categoria ${categoryName}.`, sortOrder: categoryProducts.findIndex((item) => item[0] === categoryId) + 1 } });
    for (const productName of products) {
      const productId = `pt-${slugOf(productName)}`;
      productIdByName.set(productName.toLowerCase(), productId);
      await prisma.productType.upsert({
        where: { id: productId },
        update: { name: productName, categoryId },
        create: { id: productId, categoryId, code: productId.replace("pt-", "PT-").toUpperCase(), name: productName, description: `${productName} dentro de ${categoryName}.`, physicalForm: productName.toLowerCase().includes("solido") ? "Solido" : "Liquido o semisolido", applicationRoute: "Topica", usageZone: categoryName, cosmeticNeed: categoryName, targetAudience: categoryName === "Bebes" ? "Infantil" : "General", difficulty: productName.toLowerCase().includes("protector solar") ? "Avanzado" : "Basico", learningSummary: "Ficha educativa sin receta. Explica familia, ingredientes frecuentes y proceso general.", manufacturingOverview: "Pesar, preparar fases, mezclar segun tecnologia, controlar parametros y documentar.", usualEquipmentJson: ["Bascula", "Agitador", "Recipiente de proceso"], processStagesJson: ["Seleccion", "Preparacion", "Mezcla", "Control", "Documentacion"], commonErrorsJson: ["No validar pH", "No documentar lote"], safetyNotes: "Usar EPP y revisar SDS/TDS." }
      });
    }
  }

  const relations = [
    ["Shampoo solido", "kf-tensioactivos", "ksf-solido-compacto", "Intermedio", ["SCI", "SCS", "Cocamidopropyl Betaine"]],
    ["Shampoo liquido", "kf-tensioactivos", null, "Intermedio", ["SCS", "Cocamidopropyl Betaine", "Glicerina"]],
    ["Shampoo hidratante", "kf-tensioactivos", null, "Intermedio", ["Glicerina", "Pantenol", "Proteina Hidrolizada"]],
    ["Acondicionador liquido", "kf-emulsiones", "ksf-emulsion-ow", "Intermedio", ["BTMS", "Alcohol Cetilico"]],
    ["Acondicionador solido", "kf-cerosos", "ksf-balsamo-anhidro", "Intermedio", ["BTMS", "Manteca de Karite"]],
    ["Leave-in", "kf-emulsiones", "ksf-emulsion-ow", "Intermedio", ["Pantenol", "Proteina Hidrolizada"]],
    ["Mascarilla capilar", "kf-emulsiones", "ksf-emulsion-ow", "Intermedio", ["BTMS", "Aceite de Argan"]],
    ["Aceite capilar", "kf-anhidros", null, "Basico", ["Aceite de Argan", "Vitamina E"]],
    ["Crema facial", "kf-emulsiones", "ksf-emulsion-ow", "Intermedio", ["Glicerina", "Olivem 1000"]],
    ["Crema corporal", "kf-emulsiones", "ksf-emulsion-ow", "Intermedio", ["Manteca de Karite", "Glicerina"]],
    ["Gel corporal", "kf-geles", null, "Basico", ["Goma Xantana", "Aloe Vera"]],
    ["Serum", "kf-soluciones", null, "Intermedio", ["Niacinamida", "Acido hialuronico"]],
    ["Balsamo labial", "kf-cerosos", "ksf-balsamo-anhidro", "Basico", ["Manteca de Karite", "Aceite de Coco"]],
    ["Bombas efervescentes", "kf-efervescentes", null, "Avanzado", ["Arcilla Blanca"]],
    ["Perfume", "kf-perfumeria", null, "Intermedio", ["Vitamina E"]],
    ["Extracto", "kf-extractivas", null, "Basico", ["Romero", "Ortiga"]],
    ["Macerado", "kf-extractivas", null, "Basico", ["Romero", "Ortiga"]],
    ["Syndet", "kf-solidos", "ksf-solido-compacto", "Intermedio", ["SCI", "SCS"]],
    ["Exfoliante corporal", "kf-dispersiones", null, "Basico", ["Arcilla Verde", "Arcilla Blanca"]],
    ["Protector solar", "kf-emulsiones", "ksf-emulsion-ow", "Avanzado", ["Glicerina", "Olivem 1000"]]
  ] as const;
  for (const [productName, familyId, subfamilyId, complexityLevel, ingredients] of relations) {
    const productTypeId = productIdByName.get(productName.toLowerCase());
    if (productTypeId) await prisma.productFamilyRelation.upsert({ where: { id: `rel-${productTypeId}-${familyId}` }, update: { complexityLevel, frequentIngredientsJson: ingredients }, create: { id: `rel-${productTypeId}-${familyId}`, productTypeId, familyId, subfamilyId, relationType: "principal", complexityLevel, physicalForm: "Registrada", applicationRoute: "Topica", usageZone: "Cosmetica", cosmeticNeed: "Consulta", targetAudience: "General", frequentIngredientsJson: ingredients, recommendedControlsJson: ["pH", "Viscosidad", "Apariencia"], equipmentJson: ["Bascula", "Agitador"] } });
  }

  const needs = [
    ["need-cabello-seco", "Cabello", "Cabello seco", ["Shampoo hidratante", "Acondicionador liquido", "Mascarilla capilar", "Leave-in", "Serum capilar"], ["kf-tensioactivos", "kf-emulsiones", "kf-anhidros"], ["rm-pantenol", "rm-glicerina", "rm-proteina", "rm-argan", "rm-karite"], "Intermedio"],
    ["need-cabello-graso", "Cabello", "Cabello graso", ["Shampoo para cabello graso", "Shampoo liquido", "Shampoo solido"], ["kf-tensioactivos"], ["rm-sci", "rm-scs", "rm-arcilla-verde"], "Basico"],
    ["need-caspa", "Cabello", "Caspa", ["Shampoo anticaspa", "Shampoo liquido"], ["kf-tensioactivos"], ["rm-romero", "rm-ortiga"], "Intermedio"],
    ["need-piel-grasa", "Piel", "Piel grasa", ["Limpiador facial", "Gel corporal", "Serum"], ["kf-tensioactivos", "kf-geles", "kf-soluciones"], ["rm-niacinamida", "rm-glicerina"], "Intermedio"],
    ["need-hidratacion", "Piel", "Hidratacion", ["Crema facial", "Crema corporal", "Locion"], ["kf-emulsiones"], ["rm-glicerina", "rm-acido-hialuronico", "rm-pantenol"], "Basico"],
    ["need-relajacion", "Spa", "Relajacion", ["Sales de bano", "Bruma corporal", "Roll-on aromatico"], ["kf-soluciones", "kf-perfumeria", "kf-anhidros"], ["rm-romero"], "Basico"]
  ] as const;
  for (const [id, area, name, productNames, familyIds, rawMaterialIds, difficulty] of needs) {
    await prisma.cosmeticNeed.upsert({ where: { id }, update: { name, area }, create: { id, code: id.replace("need-", "NEED-").toUpperCase(), area, name, description: `Ruta guiada para ${name}.`, productTypeIdsJson: productNames.map((name) => productIdByName.get(name.toLowerCase())).filter(Boolean), familyIdsJson: familyIds, rawMaterialIdsJson: rawMaterialIds, equipmentJson: ["Bascula", "Agitador", "Mezclador", "Homogeneizador"], controlsJson: ["pH", "Viscosidad", "Estabilidad", "Apariencia"], difficulty } });
  }

  const glossary = [["glos-tensioactivo", "kf-tensioactivos", "Tensioactivo"], ["glos-emulsion", "kf-emulsiones", "Emulsion"], ["glos-anhidro", "kf-anhidros", "Anhidro"], ["glos-fefo", null, "FEFO"], ["glos-ph", null, "pH"]] as const;
  for (const [id, familyId, term] of glossary) await prisma.familyGlossaryTerm.upsert({ where: { id }, update: { term }, create: { id, familyId, term, simpleDefinition: `${term}: termino del Centro de Conocimiento explicado para principiantes.`, technicalDefinition: "Definicion tecnica demo pendiente de fuente documental especifica.", relatedTermsJson: [term] } });

  for (const [index, term] of ["quiero fabricar shampoo", "cabello seco", "piel grasa", "crema", "emulsion", "tensioactivo", "caspa", "hidratacion", "anti edad", "protector solar", "gel refrescante", "sistema anhidro"].entries()) {
    await prisma.productSearchTerm.upsert({ where: { id: `kst-${index + 1}` }, update: { term }, create: { id: `kst-${index + 1}`, productTypeId: index % 2 === 0 ? productIdByName.get("shampoo solido") : productIdByName.get("crema facial"), familyId: index % 3 === 0 ? "kf-tensioactivos" : "kf-emulsiones", needId: index % 2 === 0 ? "need-cabello-seco" : "need-hidratacion", term, termType: "universal", weight: 5 } });
  }

  for (const [id, desiredOutcome, usageZone, physicalForm, difficulty, cosmeticNeed, productNames, familyIds, rawMaterialIds] of [
    ["gsr-cabello-seco", "fabricar producto para cabello seco", "Cabello", "Liquido o semisolido", "Intermedio", "Cabello seco", ["Shampoo hidratante", "Acondicionador liquido", "Mascarilla capilar"], ["kf-tensioactivos", "kf-emulsiones"], ["rm-pantenol", "rm-glicerina"]],
    ["gsr-piel-grasa", "producto para piel grasa", "Piel", "Gel", "Intermedio", "Piel grasa", ["Limpiador facial", "Serum"], ["kf-geles", "kf-soluciones"], ["rm-niacinamida"]],
    ["gsr-anhidro", "sistema anhidro", "Corporal", "Solido", "Basico", "Hidratacion", ["Balsamo labial", "Manteca corporal"], ["kf-anhidros", "kf-cerosos"], ["rm-karite", "rm-coco"]]
  ] as const) await prisma.guidedSelectionRule.upsert({ where: { id }, update: { desiredOutcome }, create: { id, code: id.replace("gsr-", "GSR-").toUpperCase(), desiredOutcome, usageZone, physicalForm, difficulty, cosmeticNeed, productTypeIdsJson: productNames.map((name) => productIdByName.get(name.toLowerCase())).filter(Boolean), familyIdsJson: familyIds, rawMaterialIdsJson: rawMaterialIds } });

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

  const productionOrders = [
    ["po-demo-01", "OP-00001", "terminada", "alta", 1000, 940],
    ["po-demo-02", "OP-00002", "terminada", "media", 500, 485],
    ["po-demo-03", "OP-00003", "terminada", "media", 250, 240],
    ["po-demo-04", "OP-00004", "en_proceso", "urgente", 1000, null],
    ["po-demo-05", "OP-00005", "pausada", "alta", 500, null]
  ] as const;
  const productionMaterials = [
    ["ing-sci", "rm-sci", "lot-demo-01", 45],
    ["ing-betaina", "rm-betaina", "lot-demo-04", 10],
    ["ing-karite", "rm-karite", "lot-demo-08", 8]
  ] as const;
  const checklistLabels = ["Equipo limpio", "Materia prima liberada", "Basculas calibradas", "EPP colocado", "Documentacion disponible"] as const;

  for (const [id, permanentCode, status, priority, plannedQuantity, actualYield] of productionOrders) {
    await prisma.productionOrder.upsert({
      where: { id },
      update: {
        status,
        priority,
        plannedQuantity,
        expectedYield: plannedQuantity,
        actualYield,
        yieldDifference: actualYield == null ? null : Math.round((actualYield - plannedQuantity) * 1000) / 1000,
        finishedAt: status === "terminada" ? new Date("2026-08-02T16:00:00.000Z") : null
      },
      create: {
        id,
        organizationId: organization.id,
        permanentCode,
        formulationVersionId: "frm-shampoo-v1",
        status,
        priority,
        targetLotCode: `PT-${permanentCode}`,
        plannedQuantity,
        plannedUnit: "g",
        expectedYield: plannedQuantity,
        responsibleUserId: "demo-user",
        operatorUserId: "demo-user",
        plannedStartAt: new Date("2026-08-02T10:00:00.000Z"),
        startedAt: ["terminada", "en_proceso", "pausada"].includes(status) ? new Date("2026-08-02T10:30:00.000Z") : null,
        finishedAt: status === "terminada" ? new Date("2026-08-02T16:00:00.000Z") : null,
        actualYield,
        yieldDifference: actualYield == null ? null : Math.round((actualYield - plannedQuantity) * 1000) / 1000,
        wasteTotal: status === "terminada" ? 5 : 0,
        expectedCost: Math.round(plannedQuantity * 0.42 * 100) / 100,
        notes: "Orden demo del MVP de laboratorio y produccion."
      }
    });

    for (const [index, label] of checklistLabels.entries()) {
      await prisma.productionChecklistItem.upsert({
        where: { id: `${id}-chk-${index + 1}` },
        update: { label, completed: status !== "borrador" },
        create: {
          id: `${id}-chk-${index + 1}`,
          organizationId: organization.id,
          productionOrderId: id,
          label,
          required: true,
          completed: status !== "borrador",
          completedAt: status !== "borrador" ? new Date("2026-08-02T10:15:00.000Z") : null,
          completedByUserId: status !== "borrador" ? "demo-user" : null
        }
      });
    }

    for (const [ingredientId, rawMaterialId, lotId, percentage] of productionMaterials) {
      const requiredQuantity = Math.round((percentage / 100) * plannedQuantity * 1000) / 1000;
      const confirmed = ["terminada", "en_proceso", "pausada"].includes(status);
      await prisma.productionConsumption.upsert({
        where: { id: `${id}-cons-${rawMaterialId}` },
        update: {
          rawMaterialLotId: confirmed ? lotId : null,
          requiredQuantity,
          usedQuantity: confirmed ? requiredQuantity : null,
          wasteQuantity: status === "terminada" ? 1 : 0,
          confirmedAt: confirmed ? new Date("2026-08-02T11:00:00.000Z") : null
        },
        create: {
          id: `${id}-cons-${rawMaterialId}`,
          organizationId: organization.id,
          productionOrderId: id,
          rawMaterialMasterId: rawMaterialId,
          rawMaterialLotId: confirmed ? lotId : null,
          formulationIngredientId: ingredientId,
          requiredQuantity,
          usedQuantity: confirmed ? requiredQuantity : null,
          wasteQuantity: status === "terminada" ? 1 : 0,
          unit: "g",
          observations: confirmed ? "Consumo demo trazable." : "Pendiente de consumo real.",
          confirmedAt: confirmed ? new Date("2026-08-02T11:00:00.000Z") : null,
          confirmedByUserId: confirmed ? "demo-user" : null,
          inventoryMovementId: confirmed ? `${id}-mov-${rawMaterialId}` : null
        }
      });

      if (confirmed) {
        await prisma.inventoryMovement.upsert({
          where: { id: `${id}-mov-${rawMaterialId}` },
          update: { quantity: requiredQuantity + (status === "terminada" ? 1 : 0) },
          create: {
            id: `${id}-mov-${rawMaterialId}`,
            organizationId: organization.id,
            lotId,
            type: "salida",
            quantity: requiredQuantity + (status === "terminada" ? 1 : 0),
            unit: "g",
            previousBalance: 1000,
            newBalance: Math.max(1000 - requiredQuantity, 0),
            previousReserved: 0,
            newReserved: 0,
            reason: `Consumo produccion ${permanentCode}`,
            reference: permanentCode,
            createdByUserId: "demo-user"
          }
        });
      }
    }

    await prisma.productionLog.upsert({
      where: { id: `${id}-log-start` },
      update: { observations: "Inicio demo de produccion." },
      create: { id: `${id}-log-start`, organizationId: organization.id, productionOrderId: id, type: "inicio", operatorUserId: "demo-user", temperature: 24, timeMinutes: 0, agitationSpeed: 0, observations: "Inicio demo de produccion." }
    });
    await prisma.productionProcessParameter.upsert({
      where: { id: `${id}-param-1` },
      update: { temperature: 28, ph: 5.5 },
      create: { id: `${id}-param-1`, organizationId: organization.id, productionOrderId: id, recordedByUserId: "demo-user", temperature: 28, timeMinutes: 20, speed: 600, ph: 5.5, viscosity: "Media", obtainedWeight: actualYield, observations: "Parametro demo de proceso." }
    });

    if (status === "terminada" && actualYield != null) {
      await prisma.finishedProductLot.upsert({
        where: { productionOrderId: id },
        update: { quantityObtained: actualYield, actualYield },
        create: { id: `${id}-finished-lot`, organizationId: organization.id, productionOrderId: id, lotCode: `PT-${permanentCode}`, producedAt: new Date("2026-08-02T16:00:00.000Z"), responsibleUserId: "demo-user", quantityObtained: actualYield, unit: "g", expectedYield: plannedQuantity, actualYield }
      });
    }
  }

  const kdeTypes = [
    ["dt-tds", "TDS", "TDS", "Tecnico"],
    ["dt-sds", "SDS", "SDS", "Tecnico"],
    ["dt-coa", "COA", "COA", "Tecnico"],
    ["dt-msds", "MSDS", "MSDS", "Tecnico"],
    ["dt-especificacion", "ESPECIFICACION", "Especificacion", "Tecnico"],
    ["dt-certificado", "CERTIFICADO", "Certificado", "Tecnico"],
    ["dt-hoja-tecnica", "HOJA_TECNICA", "Hoja tecnica", "Tecnico"],
    ["dt-cotizacion", "COTIZACION", "Cotizacion", "Comercial"],
    ["dt-lista-precios", "LISTA_PRECIOS", "Lista de precios", "Comercial"],
    ["dt-catalogo", "CATALOGO", "Catalogo", "Comercial"],
    ["dt-ficha-comercial", "FICHA_COMERCIAL", "Ficha comercial", "Comercial"],
    ["dt-articulo", "ARTICULO", "Articulo", "Cientifico"],
    ["dt-patente", "PATENTE", "Patente", "Cientifico"],
    ["dt-paper", "PAPER", "Paper", "Cientifico"],
    ["dt-libro", "LIBRO", "Libro", "Cientifico"],
    ["dt-investigacion", "INVESTIGACION", "Investigacion", "Cientifico"],
    ["dt-iso", "ISO", "ISO", "Normativo"],
    ["dt-nom", "NOM", "NOM", "Normativo"],
    ["dt-astm", "ASTM", "ASTM", "Normativo"],
    ["dt-usp", "USP", "USP", "Normativo"],
    ["dt-farmacopea", "FARMACOPEA", "Farmacopea", "Normativo"],
    ["dt-reglamento", "REGLAMENTO", "Reglamento", "Normativo"],
    ["dt-procedimiento", "PROCEDIMIENTO", "Procedimiento", "Produccion"],
    ["dt-instructivo", "INSTRUCTIVO", "Instructivo", "Produccion"],
    ["dt-bitacora", "BITACORA", "Bitacora", "Produccion"],
    ["dt-evidencia", "EVIDENCIA", "Evidencia", "Produccion"],
    ["dt-fotografia", "FOTOGRAFIA", "Fotografia", "Produccion"],
    ["dt-video", "VIDEO", "Video", "Produccion"],
    ["dt-ensayo", "ENSAYO", "Ensayo", "Laboratorio"],
    ["dt-reporte", "REPORTE", "Reporte", "Laboratorio"],
    ["dt-estabilidad", "ESTABILIDAD", "Estabilidad", "Laboratorio"],
    ["dt-cromatografia", "CROMATOGRAFIA", "Cromatografia", "Laboratorio"],
    ["dt-microscopia", "MICROSCOPIA", "Microscopia", "Laboratorio"],
    ["dt-resultado", "RESULTADO", "Resultado", "Laboratorio"],
    ["dt-general", "DOCUMENTO_GENERAL", "Documento general", "General"]
  ] as const;

  for (const [id, code, name, category] of kdeTypes) {
    await prisma.kdeDocumentType.upsert({
      where: { id },
      update: { code, name, category, status: "activo" },
      create: { id, organizationId: organization.id, code, name, category, description: `Tipo documental KDE demo: ${name}.`, status: "activo" }
    });
  }

  for (const [index, status] of ["pendiente", "procesando", "procesado", "requiere_revision", "rechazado"].entries()) {
    await prisma.documentStatusCatalog.upsert({
      where: { id: `ds-${status}` },
      update: { name: status.replace("_", " "), status: "activo" },
      create: { id: `ds-${status}`, organizationId: organization.id, code: status.toUpperCase(), name: status.replace("_", " "), description: `Estado documental ${index + 1}.`, status: "activo" }
    });
  }

  const kdeTags = ["Natural", "Organico", "Vegano", "COSMOS", "Ecocert", "Sulfato", "Conservante", "Fragancia", "Capilar", "Facial", "Produccion", "Normativo"];
  for (const [index, tag] of kdeTags.entries()) {
    await prisma.documentTag.upsert({
      where: { id: `tag-demo-${index + 1}` },
      update: { name: tag, status: "activo" },
      create: { id: `tag-demo-${index + 1}`, organizationId: organization.id, permanentCode: `TAG-${String(index + 1).padStart(6, "0")}`, name: tag, color: index % 2 === 0 ? "#2563eb" : "#059669", status: "activo" }
    });
  }

  const kdeTypeIds = kdeTypes.map(([id]) => id);
  for (let index = 1; index <= 50; index += 1) {
    const typeId = kdeTypeIds[(index - 1) % kdeTypeIds.length];
    const material = rawMaterials[(index - 1) % rawMaterials.length];
    const extension = index % 10 === 0 ? "mp4" : index % 8 === 0 ? "png" : index % 6 === 0 ? "xlsx" : index % 5 === 0 ? "docx" : index % 3 === 0 ? "csv" : index % 2 === 0 ? "txt" : "pdf";
    const title = `Documento KDE demo ${index} - ${material.commonName}`;
    const documentId = `kde-doc-${String(index).padStart(3, "0")}`;
    const versionId = `${documentId}-v1`;
    await prisma.document.upsert({
      where: { id: documentId },
      update: {
        title,
        documentTypeId: typeId,
        detectedEntity: material.commonName,
        status: index % 11 === 0 ? "requiere_revision" : "procesado",
        indexingStatus: "preparado",
        summary: `Evidencia documental demo para ${material.commonName}. Fuente registrada para busqueda, trazabilidad y RAG futuro.`
      },
      create: {
        id: documentId,
        organizationId: organization.id,
        uploadedByUserId: "demo-user",
        permanentCode: `DOC-${String(index).padStart(6, "0")}`,
        knowledgeCode: `KNW-${String(index).padStart(6, "0")}`,
        sourceCode: `SRC-${String(index).padStart(6, "0")}`,
        title,
        documentTypeId: typeId,
        language: index % 4 === 0 ? "en" : "es",
        author: index % 7 === 0 ? "Equipo tecnico demo" : null,
        supplier: index % 3 === 0 ? "Proveedor Demo Norte" : null,
        manufacturer: index % 5 === 0 ? "Fabricante Demo Lab" : null,
        detectedEntity: material.commonName,
        documentDate: new Date(`2026-07-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`),
        keywordsJson: [material.commonName, material.cosmeticFunction, extension],
        summary: `Evidencia documental demo para ${material.commonName}. Fuente registrada para busqueda, trazabilidad y RAG futuro.`,
        pageCount: extension === "pdf" ? (index % 9) + 1 : null,
        tableCount: ["csv", "xlsx"].includes(extension) ? 1 : 0,
        imageCount: ["png", "jpg", "webp", "tiff"].includes(extension) ? 1 : 0,
        indexingStatus: "preparado",
        currentVersionId: versionId,
        originalFilename: `${title.replace(/\s+/g, "_")}.${extension}`,
        storedFilename: `${documentId}.${extension}`,
        mimeType: extension === "pdf" ? "application/pdf" : extension === "txt" ? "text/plain" : extension === "csv" ? "text/csv" : extension === "png" ? "image/png" : "application/octet-stream",
        fileExtension: extension,
        sizeBytes: 24000 + index * 120,
        storagePath: `storage/incoming/${documentId}.${extension}`,
        status: index % 11 === 0 ? "requiere_revision" : "procesado"
      }
    });
    await prisma.documentVersion.upsert({
      where: { documentId_versionNumber: { documentId, versionNumber: 1 } },
      update: { originalFilename: `${title.replace(/\s+/g, "_")}.${extension}`, sizeBytes: 24000 + index * 120 },
      create: { id: versionId, organizationId: organization.id, documentId, versionNumber: 1, originalFilename: `${title.replace(/\s+/g, "_")}.${extension}`, storedFilename: `${documentId}.${extension}`, mimeType: extension === "pdf" ? "application/pdf" : "application/octet-stream", fileExtension: extension, sizeBytes: 24000 + index * 120, storagePath: `storage/incoming/${documentId}.${extension}`, checksumSha256: `demo-checksum-${index}`, changeReason: "Version demo inicial", createdByUserId: "demo-user" }
    });
    if (index % 10 === 0) {
      await prisma.documentVersion.upsert({
        where: { documentId_versionNumber: { documentId, versionNumber: 2 } },
        update: { changeReason: "Actualizacion demo de evidencia" },
        create: { id: `${documentId}-v2`, organizationId: organization.id, documentId, versionNumber: 2, originalFilename: `${title.replace(/\s+/g, "_")}_rev2.${extension}`, storedFilename: `${documentId}-v2.${extension}`, mimeType: "application/octet-stream", fileExtension: extension, sizeBytes: 25000 + index * 120, storagePath: `storage/incoming/${documentId}-v2.${extension}`, checksumSha256: `demo-checksum-${index}-v2`, changeReason: "Actualizacion demo de evidencia", createdByUserId: "demo-user" }
      });
    }
    await prisma.documentRelation.upsert({
      where: { id: `${documentId}-rel-material` },
      update: { entityId: material.id, validationStatus: "pendiente" },
      create: { id: `${documentId}-rel-material`, organizationId: organization.id, documentId, entityType: "raw_material_master", entityId: material.id, relationType: "evidencia", sourceReference: "seed demo", confidence: 0.82, validationStatus: "pendiente", createdByUserId: "demo-user" }
    });
    await prisma.documentChunk.upsert({
      where: { chunkCode: `${documentId}-CHK-001` },
      update: { content: `Chunk demo trazable de ${title}. Preparado para embeddings futuros sin generarlos todavia.` },
      create: { id: `${documentId}-chunk-1`, organizationId: organization.id, documentId, chunkCode: `${documentId}-CHK-001`, chunkIndex: 1, content: `Chunk demo trazable de ${title}. Preparado para embeddings futuros sin generarlos todavia.`, sourceReference: "chunk 1", embeddingStatus: "preparado" }
    });
    await prisma.ocrResult.upsert({
      where: { id: `${documentId}-ocr-1` },
      update: { text: `OCR demo para ${title}.` },
      create: { id: `${documentId}-ocr-1`, organizationId: organization.id, documentId, text: `OCR demo para ${title}.`, confidence: 0.76, detectedLanguage: "es", engine: "demo_ocr_preparado", sourceReference: "pagina 1", createdByUserId: "demo-user" }
    });
    await prisma.knowledgeSource.upsert({
      where: { id: `${documentId}-source-1` },
      update: { title, validationStatus: "pendiente" },
      create: { id: `${documentId}-source-1`, organizationId: organization.id, permanentCode: `SRC-${String(index + 100).padStart(6, "0")}`, documentId, sourceType: "documento", title, citation: `Fuente demo KDE ${index}.`, evidenceLevel: "documental", validationStatus: "pendiente" }
    });
    await prisma.documentTagLink.upsert({
      where: { documentId_tagId: { documentId, tagId: `tag-demo-${(index % kdeTags.length) + 1}` } },
      update: {},
      create: { id: `${documentId}-tag-link`, organizationId: organization.id, documentId, tagId: `tag-demo-${(index % kdeTags.length) + 1}` }
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
