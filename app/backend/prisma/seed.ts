import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma as graphPrisma } from "../src/db.js";
import { syncGraph } from "../src/services/graph.service.js";

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

  const approvedVersion = await prisma.formulationVersion.findFirst({ where: { organizationId: organization.id, status: "aprobada" }, include: { family: true } });
  const methodNames = ["Apariencia", "Color", "Olor", "pH", "Viscosidad", "Densidad", "Peso", "Rendimiento", "Espuma", "Estabilidad visual"];
  for (const [index, name] of methodNames.entries()) {
    await prisma.labTestMethod.upsert({
      where: { id: `lab-method-${index + 1}` },
      update: { name, validationStatus: index < 6 ? "validado" : "borrador", locked: index < 6 },
      create: {
        id: `lab-method-${index + 1}`,
        organizationId: organization.id,
        permanentCode: `LAB-MTH-${String(index + 1).padStart(6, "0")}`,
        name,
        description: `Metodo demo para evaluacion de ${name.toLowerCase()}.`,
        preparation: "Preparar muestra homogenea y registrar condiciones.",
        equipment: index === 3 ? "pH-metro calibrado" : index === 4 ? "Viscosimetro" : "Equipo basico de laboratorio",
        conditions: "Temperatura ambiente controlada.",
        procedureText: "Ejecutar procedimiento documentado. No inferir conclusiones sin evidencia.",
        unit: index === 3 ? "pH" : index === 4 ? "cP" : index === 5 ? "g/mL" : null,
        acceptanceCriteria: index === 3 ? "5.0-6.5" : index === 4 ? "1500-6000" : "Conforme a especificacion definida.",
        referencesText: "Fuente KDE demo asociada al metodo.",
        versionNumber: 1,
        validationStatus: index < 6 ? "validado" : "borrador",
        locked: index < 6,
        createdByUserId: "demo-user"
      }
    });
  }

  const instrumentTypes = ["balanza", "pH-metro", "viscosimetro", "densimetro", "centrifuga", "microscopio", "termometro", "camara de estabilidad"];
  for (const [index, type] of instrumentTypes.entries()) {
    await prisma.labInstrument.upsert({
      where: { id: `lab-instrument-${index + 1}` },
      update: { name: `${type} demo`, nextCalibrationAt: new Date(`2026-${index === 1 ? "07" : "09"}-15T00:00:00.000Z`) },
      create: {
        id: `lab-instrument-${index + 1}`,
        organizationId: organization.id,
        permanentCode: `LAB-INS-${String(index + 1).padStart(6, "0")}`,
        instrumentType: type,
        name: `${type} demo`,
        manufacturer: "Instrumentos Demo",
        model: `MD-${index + 1}`,
        serialNumber: `SN-LAB-${index + 1}`,
        location: index < 4 ? "Laboratorio principal" : "Sala de estabilidad",
        status: "activo",
        lastCalibrationAt: new Date("2026-06-15T00:00:00.000Z"),
        nextCalibrationAt: new Date(`2026-${index === 1 ? "07" : "09"}-15T00:00:00.000Z`),
        responsibleUserId: "demo-user",
        observations: index === 1 ? "Calibracion vencida demo para validar advertencia." : "Instrumento demo operativo."
      }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.labProject.upsert({
      where: { id: `lab-project-${index}` },
      update: { name: `Proyecto LIMS demo ${index}`, status: index === 5 ? "pausado" : index === 4 ? "completado" : "activo" },
      create: {
        id: `lab-project-${index}`,
        organizationId: organization.id,
        permanentCode: `LAB-PRJ-${String(index).padStart(6, "0")}`,
        name: `Proyecto LIMS demo ${index}`,
        projectType: ["desarrollo", "mejora", "sustitucion", "estabilidad", "incidencia tecnica"][index - 1],
        objective: "Validar muestra cosmetica con evidencia documental y trazabilidad completa.",
        responsibleUserId: "demo-user",
        priority: index === 5 ? "alta" : "media",
        status: index === 5 ? "pausado" : index === 4 ? "completado" : "activo",
        startDate: new Date(`2026-08-0${index}T00:00:00.000Z`),
        targetDate: new Date(`2026-09-0${index}T00:00:00.000Z`),
        formulationFamilyId: approvedVersion?.formulationFamilyId,
        formulationVersionId: approvedVersion?.id,
        observations: "Proyecto demo integrado con formulacion aprobada y KDE."
      }
    });
    await prisma.labTimelineEvent.upsert({
      where: { id: `lab-project-${index}-event` },
      update: { title: "Proyecto creado" },
      create: { id: `lab-project-${index}-event`, organizationId: organization.id, projectId: `lab-project-${index}`, eventType: "creacion", title: "Proyecto creado", description: "Evento demo de timeline LIMS.", createdByUserId: "demo-user" }
    });
  }

  for (let index = 1; index <= 12; index += 1) {
    const projectId = `lab-project-${((index - 1) % 5) + 1}`;
    await prisma.labSample.upsert({
      where: { id: `lab-sample-${index}` },
      update: { status: index % 6 === 0 ? "aprobada" : index % 4 === 0 ? "retenida" : "en_evaluacion" },
      create: {
        id: `lab-sample-${index}`,
        organizationId: organization.id,
        permanentCode: `LAB-SMP-${String(index).padStart(6, "0")}`,
        projectId,
        formulationFamilyId: approvedVersion?.formulationFamilyId,
        formulationVersionId: approvedVersion?.id,
        pilotLotCode: `PIL-${String(index).padStart(4, "0")}`,
        preparedAt: new Date(`2026-08-${String((index % 20) + 1).padStart(2, "0")}T09:00:00.000Z`),
        responsibleUserId: "demo-user",
        quantity: 250 + index * 10,
        unit: "g",
        location: index % 2 === 0 ? "Camara 25 C" : "Anaquel laboratorio",
        storageConditions: index % 2 === 0 ? "25 C protegido de luz" : "Ambiente controlado",
        status: index % 6 === 0 ? "aprobada" : index % 4 === 0 ? "retenida" : "en_evaluacion",
        observations: "Muestra demo para LIMS."
      }
    });
  }

  for (let index = 1; index <= 30; index += 1) {
    const sampleId = `lab-sample-${((index - 1) % 12) + 1}`;
    const methodId = `lab-method-${((index - 1) % 10) + 1}`;
    const numeric = index % 5 === 0 ? 7.2 : index % 3 === 0 ? 5.6 : null;
    const conformity = numeric === 7.2 ? "no_conforme" : numeric === 5.6 ? "conforme" : "pendiente";
    await prisma.labTest.upsert({
      where: { id: `lab-test-${index}` },
      update: { conformityStatus: conformity },
      create: {
        id: `lab-test-${index}`,
        organizationId: organization.id,
        permanentCode: `LAB-TST-${String(index).padStart(6, "0")}`,
        sampleId,
        methodId,
        testType: methodNames[(index - 1) % methodNames.length],
        unit: index % 3 === 0 ? "pH" : null,
        specification: index % 3 === 0 ? "5.0-6.5" : "Criterio cualitativo documentado",
        numericResult: numeric,
        qualitativeResult: numeric == null ? (index % 4 === 0 ? "Separacion leve observada" : "Apariencia uniforme") : null,
        instrumentId: `lab-instrument-${((index - 1) % 8) + 1}`,
        analystUserId: "demo-user",
        testedAt: new Date(`2026-08-${String((index % 24) + 1).padStart(2, "0")}T11:00:00.000Z`),
        status: "completado",
        conformityStatus: conformity,
        observations: "Resultado demo trazable.",
        evidenceDocumentId: `kde-doc-${String(((index - 1) % 50) + 1).padStart(3, "0")}`
      }
    });
  }

  for (let index = 1; index <= 3; index += 1) {
    await prisma.labStabilityStudy.upsert({
      where: { id: `lab-stability-${index}` },
      update: { conditionName: ["ambiente", "40 C", "ciclos frio/calor"][index - 1] },
      create: {
        id: `lab-stability-${index}`,
        organizationId: organization.id,
        permanentCode: `LAB-STB-${String(index).padStart(6, "0")}`,
        sampleId: `lab-sample-${index}`,
        conditionName: ["ambiente", "40 C", "ciclos frio/calor"][index - 1],
        temperature: index === 2 ? 40 : index === 3 ? 4 : 25,
        humidity: index === 2 ? 75 : 50,
        light: index === 1 ? "protegido" : "controlada",
        packaging: "Envase PET demo",
        durationDays: index === 3 ? 30 : 90,
        conclusion: null,
        status: "activo"
      }
    });
    for (const day of [0, 7, 14, 30]) {
      await prisma.labStabilityPoint.upsert({
        where: { id: `lab-stability-${index}-day-${day}` },
        update: { status: day === 0 ? "evaluado" : "pendiente" },
        create: { id: `lab-stability-${index}-day-${day}`, organizationId: organization.id, studyId: `lab-stability-${index}`, dayNumber: day, scheduledAt: new Date(`2026-08-${String(Math.min(day + 1, 28)).padStart(2, "0")}T09:00:00.000Z`), evaluatedAt: day === 0 ? new Date("2026-08-01T09:30:00.000Z") : null, testId: day === 0 ? `lab-test-${index}` : null, resultSummary: day === 0 ? "Punto inicial evaluado." : null, status: day === 0 ? "evaluado" : "pendiente" }
      });
    }
  }

  for (let index = 1; index <= 2; index += 1) {
    await prisma.labNonConformity.upsert({
      where: { id: `lab-ncf-${index}` },
      update: { status: index === 1 ? "abierta" : "en_investigacion" },
      create: { id: `lab-ncf-${index}`, organizationId: organization.id, permanentCode: `LAB-NCF-${String(index).padStart(6, "0")}`, projectId: `lab-project-${index}`, sampleId: `lab-sample-${index * 2}`, testId: `lab-test-${index * 5}`, instrumentId: `lab-instrument-${index}`, methodId: `lab-method-${index}`, deviation: "Resultado fuera de especificacion demo.", preliminaryCause: "Causa preliminar pendiente de confirmacion.", actionPlan: "Repetir ensayo y revisar instrumento.", responsibleUserId: "demo-user", evidenceDocumentId: `kde-doc-${String(index).padStart(3, "0")}`, status: index === 1 ? "abierta" : "en_investigacion" }
    });
  }

  for (let index = 1; index <= 2; index += 1) {
    await prisma.labTechnicalRelease.upsert({
      where: { id: `lab-release-${index}` },
      update: { conclusion: "Liberacion tecnica demo documentada." },
      create: {
        id: `lab-release-${index}`,
        organizationId: organization.id,
        sampleId: `lab-sample-${index}`,
        decision: index === 1 ? "aprobada" : "aprobada_con_observaciones",
        responsibleUserId: "demo-user",
        conclusion: "Liberacion tecnica demo documentada.",
        digitalConfirmation: "demo-user-confirmado",
        documentIdsJson: [`kde-doc-${String(index).padStart(3, "0")}`],
        tests: { connect: [{ id: `lab-test-${index}` }, { id: `lab-test-${index + 12}` }] }
      }
    });
    await prisma.labSample.update({ where: { id: `lab-sample-${index}` }, data: { released: true, status: "aprobada" } });
    await prisma.labTest.updateMany({ where: { id: { in: [`lab-test-${index}`, `lab-test-${index + 12}`] } }, data: { releasedLocked: true, status: "aprobado_tecnicamente" } });
  }

  for (let index = 1; index <= 10; index += 1) {
    await prisma.qualitySpecification.upsert({
      where: { id: `qlt-spec-${index}` },
      update: { status: index === 10 ? "obsoleta" : "aprobada", locked: index !== 10 },
      create: {
        id: `qlt-spec-${index}`,
        organizationId: organization.id,
        permanentCode: `QLT-SPC-${String(index).padStart(6, "0")}`,
        name: `Especificacion calidad demo ${index}`,
        entityType: index <= 4 ? "materia_prima" : index <= 7 ? "producto_terminado" : "producto_en_proceso",
        entityId: index <= rawMaterials.length ? rawMaterials[index - 1].id : null,
        versionNumber: 1,
        status: index === 10 ? "obsoleta" : "aprobada",
        effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
        responsibleUserId: "demo-user",
        documentId: `kde-doc-${String(index).padStart(3, "0")}`,
        locked: index !== 10
      }
    });
    await prisma.qualitySpecificationCriterion.upsert({
      where: { id: `qlt-spec-${index}-crit-ph` },
      update: { minLimit: 5, maxLimit: 6.5 },
      create: { id: `qlt-spec-${index}-crit-ph`, organizationId: organization.id, specificationId: `qlt-spec-${index}`, name: "pH", minLimit: 5, maxLimit: 6.5, unit: "pH", methodId: "lab-method-4", frequency: "por lote", criticality: "alta", orderIndex: 1 }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.qualitySamplingPlan.upsert({
      where: { id: `qlt-plan-${index}` },
      update: { sampleQuantity: index + 1 },
      create: { id: `qlt-plan-${index}`, organizationId: organization.id, permanentCode: `QLT-SMP-${String(index).padStart(6, "0")}`, materialType: index % 2 === 0 ? "producto terminado" : "materia prima", supplierName: "Proveedor Demo Norte", category: "Cosmetico", productName: `Producto demo ${index}`, riskLevel: index === 5 ? "alto" : "medio", lotSizeRange: "1-100 kg", inspectionLevel: "normal", method: "Muestreo aleatorio documentado", sampleQuantity: index + 1, samplingPointsJson: ["inicio", "medio", "final"], responsibleUserId: "demo-user", instructions: "Tomar muestra, identificar, fotografiar y vincular evidencia KDE.", acceptanceCriteria: "Cumplir especificacion aprobada y documentacion completa.", documentId: `kde-doc-${String(index + 10).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 15; index += 1) {
    const status = index % 7 === 0 ? "rechazado" : index % 5 === 0 ? "en_cuarentena" : index % 4 === 0 ? "aprobado_con_observaciones" : "aprobado";
    await prisma.qualityInspection.upsert({
      where: { id: `qlt-inspection-${index}` },
      update: { status },
      create: { id: `qlt-inspection-${index}`, organizationId: organization.id, permanentCode: `QLT-INS-${String(index).padStart(6, "0")}`, inspectionType: "recepcion", lotId: `lot-demo-${String(((index - 1) % 25) + 1).padStart(2, "0")}`, supplierName: index % 3 === 0 ? "Proveedor Demo Norte" : "Proveedor Demo Sur", receivedQuantity: 1000 + index * 20, unit: "g", packageIntegrity: index % 7 === 0 ? "daniado" : "integro", identification: "correcta", color: "conforme", odor: "conforme", appearance: index % 7 === 0 ? "fuera de especificacion" : "conforme", initialResult: status, observations: "Inspeccion demo trazable.", status, specificationId: `qlt-spec-${((index - 1) % 9) + 1}`, evidenceDocumentId: `kde-doc-${String(((index - 1) % 50) + 1).padStart(3, "0")}`, responsibleUserId: "demo-user", inspectedAt: new Date(`2026-08-${String((index % 24) + 1).padStart(2, "0")}T10:00:00.000Z`) }
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    await prisma.qualityRelease.upsert({
      where: { id: `qlt-release-${index}` },
      update: { decision: index > 5 ? "rechazar" : "liberar" },
      create: { id: `qlt-release-${index}`, organizationId: organization.id, permanentCode: `QLT-REL-${String(index).padStart(6, "0")}`, releaseType: index > 5 ? "rechazo" : "liberacion", entityType: index <= 4 ? "materia_prima" : "producto_terminado", entityId: `quality-entity-${index}`, inspectionId: `qlt-inspection-${index}`, specificationId: `qlt-spec-${((index - 1) % 9) + 1}`, decision: index > 5 ? "rechazar" : "liberar", conclusion: index > 5 ? "Rechazo demo por resultado fuera de especificacion." : "Liberacion demo con evidencia suficiente.", reason: "Decision demo documentada.", digitalConfirmation: "demo-user-confirmado", evidenceDocumentId: `kde-doc-${String(index + 20).padStart(3, "0")}`, responsibleUserId: "demo-user", closed: true }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.qualityDeviation.upsert({
      where: { id: `qlt-dev-${index}` },
      update: { status: index === 4 ? "contenida" : "abierta" },
      create: { id: `qlt-dev-${index}`, organizationId: organization.id, permanentCode: `QLT-DEV-${String(index).padStart(6, "0")}`, deviationType: ["proceso", "resultado", "equipo", "documento"][index - 1], description: "Desviacion demo con contencion obligatoria.", severity: index === 2 ? "alta" : "media", responsibleUserId: "demo-user", affectedEntityType: "lote", affectedEntityId: `lot-demo-${String(index).padStart(2, "0")}`, preliminaryCause: "Pendiente investigacion.", containment: "Retener lote y bloquear uso hasta decision.", evidenceDocumentId: `kde-doc-${String(index + 25).padStart(3, "0")}`, status: index === 4 ? "contenida" : "abierta" }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.qualityNonConformity.upsert({
      where: { id: `qlt-ncf-${index}` },
      update: { status: index === 4 ? "cerrada" : "en_investigacion" },
      create: { id: `qlt-ncf-${index}`, organizationId: organization.id, permanentCode: `QLT-NCF-${String(index).padStart(6, "0")}`, origin: index % 2 === 0 ? "laboratorio" : "recepcion", ncfType: "fuera_de_especificacion", severity: index === 1 ? "alta" : "media", lotId: `lot-demo-${String(index).padStart(2, "0")}`, productName: `Producto demo ${index}`, supplierName: "Proveedor Demo Norte", productionOrderId: index === 3 ? "prod-order-1" : null, labReferenceId: index === 2 ? "lab-ncf-1" : null, description: "No conformidad demo trazable.", evidenceDocumentId: `kde-doc-${String(index + 30).padStart(3, "0")}`, responsibleUserId: "demo-user", status: index === 4 ? "cerrada" : "en_investigacion" }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.qualityCapaAction.upsert({
      where: { id: `qlt-capa-${index}` },
      update: { status: index === 5 ? "vencida" : "abierta" },
      create: { id: `qlt-capa-${index}`, organizationId: organization.id, permanentCode: `QLT-CAP-${String(index).padStart(6, "0")}`, actionText: "CAPA demo: revisar causa raiz, ejecutar accion y verificar eficacia.", actionType: index % 2 === 0 ? "preventiva" : "correctiva", responsibleUserId: "demo-user", targetDate: new Date(`2026-${index === 5 ? "07" : "09"}-15T00:00:00.000Z`), priority: index === 1 ? "alta" : "media", rootCause: "Causa raiz demo pendiente de confirmacion.", evidenceDocumentId: `kde-doc-${String(index + 35).padStart(3, "0")}`, effectivenessCheck: "Verificar reduccion de recurrencia.", status: index === 5 ? "vencida" : "abierta", deviationId: index <= 4 ? `qlt-dev-${index}` : null, nonConformityId: index <= 4 ? `qlt-ncf-${index}` : null }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.qualityDisposition.upsert({
      where: { id: `qlt-dsp-${index}` },
      update: { decision: index === 4 ? "destruir" : "mantener_en_cuarentena" },
      create: { id: `qlt-dsp-${index}`, organizationId: organization.id, permanentCode: `QLT-DSP-${String(index).padStart(6, "0")}`, entityType: "lote", entityId: `lot-demo-${String(index).padStart(2, "0")}`, decision: index === 4 ? "destruir" : "mantener_en_cuarentena", reason: "Disposicion demo con motivo y evidencia.", responsibleUserId: "demo-user", evidenceDocumentId: `kde-doc-${String(index + 40).padStart(3, "0")}`, nonConformityId: `qlt-ncf-${index}` }
    });
  }
  await prisma.qualityNonConformity.update({ where: { id: "qlt-ncf-4" }, data: { dispositionId: "qlt-dsp-4", status: "cerrada" } });

  const purchaseSuppliers = ["Proveedor Demo Norte", "Proveedor Demo Sur", "Proveedor Especialidades USD"];
  for (let index = 1; index <= 8; index += 1) {
    const material = rawMaterials[(index - 1) % rawMaterials.length];
    await prisma.purchaseRequest.upsert({
      where: { id: `pur-req-${index}` },
      update: { status: index > 6 ? "aprobada" : "enviada" },
      create: {
        id: `pur-req-${index}`,
        organizationId: organization.id,
        permanentCode: `PUR-REQ-${String(index).padStart(5, "0")}`,
        origin: index % 2 === 0 ? "inventario" : "produccion",
        requesterUserId: "demo-user",
        area: index % 2 === 0 ? "Almacen" : "Laboratorio",
        priority: index % 3 === 0 ? "alta" : "media",
        requiredDate: new Date(`2026-09-${String(index + 3).padStart(2, "0")}T00:00:00.000Z`),
        reason: `Solicitud demo para reabastecer ${material.commonName}.`,
        status: index > 6 ? "aprobada" : "enviada",
        observations: "Solicitud demo creada para Incremento 10.",
        documentId: `kde-doc-${String(index).padStart(3, "0")}`
      }
    });
    await prisma.purchaseRequestItem.upsert({
      where: { id: `pur-req-${index}-item` },
      update: { quantity: 1 + index },
      create: { id: `pur-req-${index}-item`, organizationId: organization.id, requestId: `pur-req-${index}`, rawMaterialMasterId: material.id, commercialProductId: `${material.id}-product`, itemName: material.commonName, quantity: 1 + index, unit: "kg", specifications: "Grado cosmetico con COA, SDS y TDS disponibles." }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    const material = rawMaterials[(index + 3) % rawMaterials.length];
    await prisma.purchaseRequisition.upsert({
      where: { id: `pur-rqn-${index}` },
      update: { status: index === 4 ? "convertida" : "aprobada" },
      create: { id: `pur-rqn-${index}`, organizationId: organization.id, permanentCode: `PUR-RQN-${String(index).padStart(5, "0")}`, responsibleUserId: "demo-user", priority: index === 1 ? "alta" : "media", targetDate: new Date(`2026-09-${String(index + 8).padStart(2, "0")}T00:00:00.000Z`), suggestedSuppliersJson: purchaseSuppliers, estimatedBudget: 2500 + index * 600, status: index === 4 ? "convertida" : "aprobada" }
    });
    await prisma.purchaseRequisitionItem.upsert({
      where: { id: `pur-rqn-${index}-item` },
      update: { quantity: 5 + index },
      create: { id: `pur-rqn-${index}-item`, organizationId: organization.id, requisitionId: `pur-rqn-${index}`, requestItemId: `pur-req-${index}-item`, itemName: material.commonName, quantity: 5 + index, unit: "kg", targetDate: new Date(`2026-09-${String(index + 10).padStart(2, "0")}T00:00:00.000Z`) }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.purchaseRfq.upsert({
      where: { id: `pur-rfq-${index}` },
      update: { status: index === 4 ? "respondida_parcialmente" : "respondida" },
      create: { id: `pur-rfq-${index}`, organizationId: organization.id, permanentCode: `PUR-RFQ-${String(index).padStart(5, "0")}`, requisitionId: `pur-rqn-${index}`, supplierNamesJson: purchaseSuppliers, itemsJson: [{ itemName: rawMaterials[index].commonName, quantity: 5 + index, unit: "kg" }], currency: index === 3 ? "USD" : "MXN", deliveryTerms: "Entrega en almacen principal con documentos completos.", deadline: new Date(`2026-08-${String(index + 15).padStart(2, "0")}T00:00:00.000Z`), terms: "Cotizar precio, vigencia, minimo de compra y tiempo de entrega.", observations: "RFQ demo Incremento 10.", documentId: `kde-doc-${String(index + 5).padStart(3, "0")}`, status: index === 4 ? "respondida_parcialmente" : "respondida" }
    });
  }

  for (let index = 1; index <= 10; index += 1) {
    const material = rawMaterials[(index + 5) % rawMaterials.length];
    const usd = index % 4 === 0;
    await prisma.purchaseQuote.upsert({
      where: { id: `pur-quo-${index}` },
      update: { unitPrice: usd ? 18 + index : 210 + index * 19 },
      create: { id: `pur-quo-${index}`, organizationId: organization.id, permanentCode: `PUR-QUO-${String(index).padStart(5, "0")}`, rfqId: `pur-rfq-${((index - 1) % 4) + 1}`, supplierId: `${material.id}-supplier`, supplierName: purchaseSuppliers[(index - 1) % purchaseSuppliers.length], commercialProductId: `${material.id}-product`, manufacturerName: "Fabricante demo", presentation: index % 2 === 0 ? "Cubeta 5 kg" : "Bolsa 1 kg", quantity: 1 + index, unitPrice: usd ? 18 + index : 210 + index * 19, taxRate: 16, shippingCost: index * 22, currency: usd ? "USD" : "MXN", exchangeRate: usd ? 18.7 : null, minimumPurchase: index % 3 === 0 ? 5 : 1, validUntil: new Date(`2026-${index > 8 ? "08" : "12"}-28T00:00:00.000Z`), leadTimeDays: 3 + index, paymentTerms: index % 2 === 0 ? "Credito 15 dias" : "Contado", availability: index % 5 === 0 ? "bajo pedido" : "disponible", documentId: `kde-doc-${String(index + 10).padStart(3, "0")}`, observations: "Cotizacion demo no sobrescribe precios previos." }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.purchaseComparison.upsert({
      where: { id: `pur-cmp-${index}` },
      update: { selected: index <= 2 },
      create: { id: `pur-cmp-${index}`, organizationId: organization.id, permanentCode: `PUR-CMP-${String(index).padStart(5, "0")}`, quoteId: `pur-quo-${index}`, criteriaJson: { precio: 40, vigencia: 20, documentacion: 25, entrega: 15 }, normalizedCost: 210 + index * 21, totalAcquisitionCost: 1250 + index * 160, qualityScore: 82 + index, selected: index <= 2, selectionReason: index <= 2 ? "Seleccion por costo normalizado, disponibilidad y documentacion completa." : "No seleccionada por vigencia o tiempo de entrega." }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    const material = rawMaterials[(index + 8) % rawMaterials.length];
    const quantity = 4 + index;
    const unitPrice = index === 3 ? 32 : 240 + index * 30;
    const currency = index === 3 ? "USD" : "MXN";
    await prisma.purchaseOrder.upsert({
      where: { id: `pur-po-${index}` },
      update: { status: index === 1 ? "recibida" : index === 2 ? "parcialmente_recibida" : index === 5 ? "pendiente_aprobacion" : "aprobada" },
      create: { id: `pur-po-${index}`, organizationId: organization.id, permanentCode: `PUR-PO-${String(index).padStart(5, "0")}`, supplierName: purchaseSuppliers[(index - 1) % purchaseSuppliers.length], requisitionId: index <= 4 ? `pur-rqn-${index}` : null, quoteId: `pur-quo-${index}`, currency, exchangeRate: currency === "USD" ? 18.7 : null, subtotal: quantity * unitPrice, taxTotal: quantity * unitPrice * 0.16, shippingTotal: 80 + index * 10, discountTotal: 0, total: quantity * unitPrice * 1.16 + 80 + index * 10, terms: "OC demo con recepcion parcial permitida y trazabilidad KDE.", promisedDate: new Date(`2026-09-${String(index + 5).padStart(2, "0")}T00:00:00.000Z`), status: index === 1 ? "recibida" : index === 2 ? "parcialmente_recibida" : index === 5 ? "pendiente_aprobacion" : "aprobada", responsibleUserId: "demo-user", documentId: `kde-doc-${String(index + 20).padStart(3, "0")}` }
    });
    await prisma.purchaseOrderItem.upsert({
      where: { id: `pur-po-${index}-item` },
      update: { quantityReceived: index === 1 ? quantity : index === 2 ? quantity / 2 : 0 },
      create: { id: `pur-po-${index}-item`, organizationId: organization.id, orderId: `pur-po-${index}`, commercialProductId: `${material.id}-product`, rawMaterialMasterId: material.id, itemName: material.commonName, quantityOrdered: quantity, quantityReceived: index === 1 ? quantity : index === 2 ? quantity / 2 : 0, unit: "kg", unitPrice, taxRate: 16, lineTotal: quantity * unitPrice }
    });
    if (index <= 4) {
      await prisma.purchaseApproval.upsert({
        where: { id: `pur-po-${index}-approval` },
        update: { decision: "aprobada" },
        create: { id: `pur-po-${index}-approval`, organizationId: organization.id, orderId: `pur-po-${index}`, approverUserId: "demo-user", decision: "aprobada", comment: "Aprobacion demo por criterios documentados.", level: 1, evidenceDocumentId: `kde-doc-${String(index + 25).padStart(3, "0")}` }
      });
    }
  }

  for (let index = 1; index <= 4; index += 1) {
    const expected = index === 4 ? 3 : 5;
    const received = index === 4 ? 1.5 : expected;
    await prisma.purchaseReceipt.upsert({
      where: { id: `pur-rcv-${index}` },
      update: { receivedQuantity: received },
      create: { id: `pur-rcv-${index}`, organizationId: organization.id, permanentCode: `PUR-RCV-${String(index).padStart(5, "0")}`, orderId: `pur-po-${Math.min(index, 3)}`, orderItemId: `pur-po-${Math.min(index, 3)}-item`, expectedQuantity: expected, receivedQuantity: received, differenceQuantity: received - expected, supplierLotCode: `SUP-PUR-${String(index).padStart(3, "0")}`, remision: `REM-${String(index).padStart(4, "0")}`, invoice: index % 2 === 0 ? `FAC-${String(index).padStart(4, "0")}` : null, packageStatus: index === 3 ? "observacion en empaque" : "integro", initialStatus: "cuarentena", observations: index === 4 ? "Recepcion parcial demo." : "Recepcion completa demo.", documentId: `kde-doc-${String(index + 30).padStart(3, "0")}`, inventoryLotId: `lot-demo-${String(index).padStart(2, "0")}`, inventoryMovementId: `pur-rcv-${index}-movement-ref`, qualityInspectionId: `qlt-inspection-${index}`, responsibleUserId: "demo-user" }
    });
  }

  await prisma.purchaseReturn.upsert({
    where: { id: "pur-rtn-1" },
    update: { status: "registrada" },
    create: { id: "pur-rtn-1", organizationId: organization.id, permanentCode: "PUR-RTN-00001", orderId: "pur-po-2", lotId: "lot-demo-02", reason: "Devolucion demo por diferencia documental detectada en recepcion.", quantity: 0.5, unit: "kg", evidenceDocumentId: "kde-doc-040", responsibleUserId: "demo-user", disposition: "devolver_a_proveedor", status: "registrada", inventoryMovementId: "pur-return-demo-movement" }
  });

  for (let index = 1; index <= 3; index += 1) {
    await prisma.supplierEvaluation.upsert({
      where: { id: `pur-evl-${index}` },
      update: { score: 78 + index * 5 },
      create: { id: `pur-evl-${index}`, organizationId: organization.id, permanentCode: `PUR-EVL-${String(index).padStart(5, "0")}`, supplierName: purchaseSuppliers[index - 1], lotsReceived: 6 + index, lotsApproved: 5 + index, lotsRejected: index === 3 ? 1 : 0, incompleteDocuments: index === 2 ? 2 : 0, incidents: index === 3 ? 2 : index - 1, responseTimeDays: 2 + index, priceVariation: index === 1 ? 4.5 : 8.2 + index, score: 78 + index * 5, trend: index === 3 ? "riesgo" : "estable", responsibleUserId: "demo-user" }
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    const material = rawMaterials[(index + 12) % rawMaterials.length];
    await prisma.supplySuggestion.upsert({
      where: { id: `pur-sug-${index}` },
      update: { status: index % 3 === 0 ? "convertida" : "sugerida" },
      create: { id: `pur-sug-${index}`, organizationId: organization.id, rawMaterialMasterId: material.id, itemName: material.commonName, availableQuantity: index * 0.7, reservedQuantity: index % 2, reorderPoint: 5, suggestedQuantity: 6 + index, reason: index % 2 === 0 ? "Stock bajo contra punto de reorden." : "Cobertura insuficiente para formulacion escalada.", status: index % 3 === 0 ? "convertida" : "sugerida" }
    });
  }

  const customerNames = ["Botanica Norte", "Spa Luna Azul", "Dermocosmetica Clara", "Hotel Aroma Vivo", "Tienda Verde", "Distribuidora Esencial"];
  for (let index = 1; index <= 12; index += 1) {
    const status = index <= 6 ? "convertido" : index % 5 === 0 ? "descartado" : index % 3 === 0 ? "calificado" : "nuevo";
    await prisma.crmLead.upsert({
      where: { id: `crm-lead-${index}` },
      update: { status },
      create: { id: `crm-lead-${index}`, organizationId: organization.id, permanentCode: `CRM-LEAD-${String(index).padStart(6, "0")}`, commercialName: index <= 6 ? customerNames[index - 1] : `Prospecto Cosmetico ${index}`, legalName: index <= 6 ? `${customerNames[index - 1]} SA de CV` : `Prospecto Cosmetico ${index} SA de CV`, personType: "moral", industry: "Cosmetica", segment: index % 2 === 0 ? "mayoreo" : "profesional", channel: index % 2 === 0 ? "distribuidor" : "directo", origin: index % 3 === 0 ? "referido" : "web", status, responsibleUserId: "demo-user", priority: index % 4 === 0 ? "alta" : "media", city: "Ciudad de Mexico", state: "CDMX", country: "Mexico", website: `https://cliente-demo-${index}.local`, observations: "Prospecto demo CRM.", tagsJson: ["cosmetica", index % 2 === 0 ? "mayoreo" : "spa"], documentId: `kde-doc-${String(index).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 6; index += 1) {
    await prisma.crmCustomer.upsert({
      where: { id: `crm-customer-${index}` },
      update: { status: "activo" },
      create: { id: `crm-customer-${index}`, organizationId: organization.id, permanentCode: `CRM-CLI-${String(index).padStart(6, "0")}`, leadId: `crm-lead-${index}`, legalName: `${customerNames[index - 1]} SA de CV`, commercialName: customerNames[index - 1], rfcPrepared: "RFC preparado", customerType: index % 2 === 0 ? "Distribuidor" : "Cliente profesional", segment: index % 2 === 0 ? "mayoreo" : "profesional", commercialTerms: "Condiciones demo: anticipo 50%, entrega contra liberacion de calidad.", currency: index === 3 ? "USD" : "MXN", creditPrepared: index % 2 === 0, addressesJson: [{ city: "Ciudad de Mexico", state: "CDMX", country: "Mexico", street: `Calle Demo ${index}` }], documentId: `kde-doc-${String(index + 12).padStart(3, "0")}` }
    });
    await prisma.crmLead.update({ where: { id: `crm-lead-${index}` }, data: { convertedCustomerId: `crm-customer-${index}` } });
  }

  for (let index = 1; index <= 18; index += 1) {
    const customerId = index <= 12 ? `crm-customer-${((index - 1) % 6) + 1}` : null;
    const leadId = index > 12 ? `crm-lead-${index - 6}` : `crm-lead-${((index - 1) % 6) + 1}`;
    await prisma.crmContact.upsert({
      where: { id: `crm-contact-${index}` },
      update: { status: "activo" },
      create: { id: `crm-contact-${index}`, organizationId: organization.id, permanentCode: `CRM-CON-${String(index).padStart(6, "0")}`, leadId, customerId, fullName: `Contacto Comercial ${index}`, position: index % 2 === 0 ? "Compras" : "Direccion tecnica", area: index % 2 === 0 ? "Compras" : "Tecnica", email: `contacto${index}@cliente-demo.local`, phone: `555-010-${String(index).padStart(2, "0")}`, whatsapp: `+5255000${String(index).padStart(4, "0")}`, preferredChannel: index % 2 === 0 ? "correo" : "whatsapp", purchasingResponsible: index % 2 === 0, technicalResponsible: index % 2 !== 0, observations: "Contacto demo CRM." }
    });
  }

  for (let index = 1; index <= 25; index += 1) {
    const customerId = `crm-customer-${((index - 1) % 6) + 1}`;
    await prisma.crmActivity.upsert({
      where: { id: `crm-act-${index}` },
      update: { status: index % 4 === 0 ? "pendiente" : "completada" },
      create: { id: `crm-act-${index}`, organizationId: organization.id, permanentCode: `CRM-ACT-${String(index).padStart(6, "0")}`, activityType: ["llamada", "correo", "reunion", "muestra_enviada", "seguimiento"][index % 5], relatedEntityType: "cliente", relatedEntityId: customerId, leadId: `crm-lead-${((index - 1) % 12) + 1}`, customerId, createdByUserId: "demo-user", responsibleUserId: "demo-user", scheduledAt: new Date(`2026-08-${String((index % 24) + 1).padStart(2, "0")}T10:00:00.000Z`), result: "Actividad demo con resultado y seguimiento documentado.", status: index % 4 === 0 ? "pendiente" : "completada", reminderPrepared: index % 4 === 0, evidenceDocumentId: `kde-doc-${String(((index - 1) % 50) + 1).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 10; index += 1) {
    const stage = ["deteccion", "calificacion", "diagnostico", "propuesta", "negociacion", "ganada", "perdida", "pausada", "propuesta", "negociacion"][index - 1];
    await prisma.crmOpportunity.upsert({
      where: { id: `crm-opp-${index}` },
      update: { stage },
      create: { id: `crm-opp-${index}`, organizationId: organization.id, permanentCode: `CRM-OPP-${String(index).padStart(6, "0")}`, leadId: `crm-lead-${((index - 1) % 12) + 1}`, customerId: index <= 8 ? `crm-customer-${((index - 1) % 6) + 1}` : null, name: `Oportunidad linea cosmetica ${index}`, productsInterestJson: ["shampoo solido", "crema corporal"], estimatedQuantity: 100 + index * 25, estimatedValue: 15000 + index * 4300, currency: index === 4 ? "USD" : "MXN", probability: Math.min(90, 15 + index * 8), estimatedCloseDate: new Date(`2026-09-${String(index + 5).padStart(2, "0")}T00:00:00.000Z`), responsibleUserId: "demo-user", competition: "Marcas locales", need: "Desarrollar producto cosmético con respaldo tecnico y documentacion.", observations: "Oportunidad demo.", stage, status: ["ganada", "perdida", "pausada"].includes(stage) ? stage : "activa" }
    });
  }

  const approvedVersionForSales = approvedVersion?.id;
  for (let index = 1; index <= 12; index += 1) {
    await prisma.salesProduct.upsert({
      where: { id: `sales-product-${index}` },
      update: { status: "activo" },
      create: { id: `sales-product-${index}`, organizationId: organization.id, permanentCode: `SAL-PRD-${String(index).padStart(6, "0")}`, name: `Producto vendible demo ${index}`, finishedProductLotId: index <= 3 ? `prod-order-${index}-finished-lot` : null, presentation: index % 2 === 0 ? "Caja 12 pzas" : "Frasco 250 ml", salesUnit: index % 2 === 0 ? "caja" : "pieza", formulationFamilyId: approvedVersion?.formulationFamilyId, formulationVersionId: approvedVersionForSales, packaging: "Envase demo", labelInfo: "Etiqueta preparada", price: 180 + index * 35, currency: index === 5 ? "USD" : "MXN", taxPrepared: true, availability: index % 4 === 0 ? "consultar" : "disponible", documentId: `kde-doc-${String(index + 20).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 3; index += 1) {
    await prisma.salesPriceList.upsert({
      where: { id: `sales-price-list-${index}` },
      update: { status: "vigente" },
      create: { id: `sales-price-list-${index}`, organizationId: organization.id, permanentCode: `SAL-PLS-${String(index).padStart(6, "0")}`, name: `Lista demo ${index}`, versionNumber: index, currency: index === 2 ? "USD" : "MXN", channel: index === 1 ? "directo" : "distribuidor", segment: index === 3 ? "mayoreo" : "profesional", customerId: index === 3 ? "crm-customer-1" : null, volumeMin: index * 10, validFrom: new Date("2026-08-01T00:00:00.000Z"), validUntil: new Date("2026-12-31T00:00:00.000Z"), itemsJson: Array.from({ length: 4 }, (_, row) => ({ productId: `sales-product-${row + 1}`, price: 180 + row * 40 + index * 10 })) }
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    const status = index === 1 ? "aceptada" : index === 2 ? "convertida" : index === 3 ? "vencida" : index === 4 ? "rechazada" : "enviada";
    const productId = `sales-product-${((index - 1) % 12) + 1}`;
    const quantity = 10 + index;
    const unitPrice = 220 + index * 30;
    await prisma.salesQuote.upsert({
      where: { id: `sales-quote-${index}` },
      update: { status },
      create: { id: `sales-quote-${index}`, organizationId: organization.id, permanentCode: `SAL-QUO-${String(index).padStart(6, "0")}`, customerId: `crm-customer-${((index - 1) % 6) + 1}`, opportunityId: `crm-opp-${((index - 1) % 10) + 1}`, contactId: `crm-contact-${((index - 1) % 18) + 1}`, currency: index === 5 ? "USD" : "MXN", exchangeRate: index === 5 ? 18.7 : null, subtotal: quantity * unitPrice, discountTotal: quantity * unitPrice * 0.05, taxTotal: quantity * unitPrice * 0.95 * 0.16, shippingTotal: 120, total: quantity * unitPrice * 0.95 * 1.16 + 120, validUntil: new Date(`2026-${index === 3 ? "07" : "09"}-${String(index + 10).padStart(2, "0")}T00:00:00.000Z`), conditions: "Condiciones comerciales demo.", estimatedDate: new Date(`2026-09-${String(index + 14).padStart(2, "0")}T00:00:00.000Z`), notes: "Cotizacion demo historica.", documentId: `kde-doc-${String(index + 30).padStart(3, "0")}`, status }
    });
    await prisma.salesQuoteItem.upsert({
      where: { id: `sales-quote-${index}-item` },
      update: { quantity },
      create: { id: `sales-quote-${index}-item`, organizationId: organization.id, quoteId: `sales-quote-${index}`, productId, quantity, unit: "pieza", unitPrice, discountRate: 5, taxRate: 16, costReference: unitPrice * 0.55, margin: 45, lineTotal: quantity * unitPrice * 0.95 }
    });
    if (index <= 4) {
      await prisma.salesApproval.upsert({
        where: { id: `sales-approval-${index}` },
        update: { decision: index === 4 ? "rechazada" : "aprobada" },
        create: { id: `sales-approval-${index}`, organizationId: organization.id, quoteId: `sales-quote-${index}`, approvalType: index === 4 ? "precio_inferior" : "descuento", approverUserId: "demo-user", decision: index === 4 ? "rechazada" : "aprobada", comment: "Aprobacion comercial demo.", reason: "Margen, descuento y condiciones revisadas.", evidenceDocumentId: `kde-doc-${String(index + 38).padStart(3, "0")}` }
      });
    }
  }

  for (let index = 1; index <= 5; index += 1) {
    const productId = `sales-product-${index}`;
    const quantity = 8 + index;
    const unitPrice = 260 + index * 25;
    await prisma.salesOrder.upsert({
      where: { id: `sales-order-${index}` },
      update: { status: index === 5 ? "entregado" : index === 4 ? "en_produccion" : index === 3 ? "en_preparacion" : "confirmado" },
      create: { id: `sales-order-${index}`, organizationId: organization.id, permanentCode: `SAL-ORD-${String(index).padStart(6, "0")}`, customerId: `crm-customer-${((index - 1) % 6) + 1}`, quoteId: index <= 2 ? `sales-quote-${index}` : null, currency: "MXN", subtotal: quantity * unitPrice, discountTotal: 0, taxTotal: quantity * unitPrice * 0.16, shippingTotal: 150, total: quantity * unitPrice * 1.16 + 150, requestedDate: new Date(`2026-09-${String(index + 5).padStart(2, "0")}T00:00:00.000Z`), promisedDate: new Date(`2026-09-${String(index + 12).padStart(2, "0")}T00:00:00.000Z`), deliveryAddressJson: { city: "CDMX", street: `Entrega Demo ${index}` }, responsibleUserId: "demo-user", status: index === 5 ? "entregado" : index === 4 ? "en_produccion" : index === 3 ? "en_preparacion" : "confirmado", availabilitySnapshotJson: [{ productId, requested: quantity, available: index <= 2 ? quantity : 0, missing: index <= 2 ? 0 : quantity, productionRequired: index > 2 }], productionSuggestionJson: index > 2 ? [{ productId, suggested: true, formulationVersionId: approvedVersionForSales }] : [], observations: "Pedido demo con disponibilidad documentada.", documentId: `kde-doc-${String(index + 42).padStart(3, "0")}` }
    });
    await prisma.salesOrderItem.upsert({
      where: { id: `sales-order-${index}-item` },
      update: { quantityDelivered: index === 5 ? quantity : index === 2 ? quantity / 2 : 0 },
      create: { id: `sales-order-${index}-item`, organizationId: organization.id, orderId: `sales-order-${index}`, productId, quantity, quantityDelivered: index === 5 ? quantity : index === 2 ? quantity / 2 : 0, unit: "pieza", unitPrice, discountRate: 0, lineTotal: quantity * unitPrice }
    });
  }

  for (let index = 1; index <= 3; index += 1) {
    await prisma.salesDelivery.upsert({
      where: { id: `sales-delivery-${index}` },
      update: { status: index === 3 ? "entregada" : "preparada" },
      create: { id: `sales-delivery-${index}`, organizationId: organization.id, permanentCode: `SAL-DLV-${String(index).padStart(6, "0")}`, orderId: `sales-order-${index}`, itemsJson: [{ orderItemId: `sales-order-${index}-item`, quantity: index === 2 ? 4 : 8 + index, qualityStatus: "liberado", lotId: `prod-order-${index}-finished-lot` }], lotIdsJson: [`prod-order-${index}-finished-lot`], deliveredAt: index === 3 ? new Date("2026-08-03T15:00:00.000Z") : null, addressJson: { city: "CDMX" }, responsibleUserId: "demo-user", carrierPrepared: "Transportista preparado demo", evidenceDocumentId: `kde-doc-${String(index + 45).padStart(3, "0")}`, status: index === 3 ? "entregada" : "preparada" }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.salesSample.upsert({
      where: { id: `sales-sample-${index}` },
      update: { result: "Seguimiento demo registrado." },
      create: { id: `sales-sample-${index}`, organizationId: organization.id, permanentCode: `SAL-SMP-${String(index).padStart(6, "0")}`, productId: `sales-product-${index}`, finishedLotId: `prod-order-${index}-finished-lot`, quantity: 3 + index, unit: "pieza", customerId: `crm-customer-${index}`, contactId: `crm-contact-${index}`, sentAt: new Date(`2026-08-${String(index + 5).padStart(2, "0")}T11:00:00.000Z`), objective: "Enviar muestra comercial para validacion sensorial y tecnica.", cost: 120 + index * 20, followUp: "Dar seguimiento en 7 dias.", result: "Seguimiento demo registrado.", evidenceDocumentId: `kde-doc-${String(index + 44).padStart(3, "0")}`, responsibleUserId: "demo-user" }
    });
  }

  const ruleTypes = ["compatibilidad", "incompatibilidad", "rango_uso", "ph", "temperatura", "orden_incorporacion", "restriccion_familia", "restriccion_producto", "alerta_documental", "alerta_calidad", "alerta_inventario", "alerta_costo", "alerta_produccion", "alerta_comercial"];
  for (let index = 1; index <= 20; index += 1) {
    const status = index <= 14 ? "validada" : index <= 17 ? "borrador" : index === 18 ? "en_revision" : index === 19 ? "rechazada" : "obsoleta";
    const severity = index % 7 === 0 ? "critica" : index % 5 === 0 ? "alta" : index % 3 === 0 ? "media" : "baja";
    await prisma.aiRule.upsert({
      where: { id: `ai-rule-${index}` },
      update: { status },
      create: {
        id: `ai-rule-${index}`,
        organizationId: organization.id,
        permanentCode: `AI-RUL-${String(index).padStart(6, "0")}`,
        name: `Regla responsable demo ${index}`,
        description: "Regla demo estructurada con fuente KDE y validacion humana requerida.",
        ruleType: ruleTypes[(index - 1) % ruleTypes.length],
        conditionJson: index % 4 === 0 ? { field: "status", operator: "in", value: ["cuarentena", "bloqueado", "rechazado"] } : index % 3 === 0 ? { field: "totalPercentage", operator: "neq", value: 100 } : index % 2 === 0 ? { field: "availableQuantity", operator: "lt", value: 10 } : { field: "evidenceDocumentId", operator: "missing" },
        severity,
        resultMessage: index % 2 === 0 ? "Se detecto condicion que requiere revision antes de continuar." : "Informacion insuficiente para evaluar sin evidencia documental.",
        source: `Documento KDE demo ${index}; responsable tecnico demo.`,
        evidenceDocumentId: `kde-doc-${String(((index - 1) % 50) + 1).padStart(3, "0")}`,
        versionNumber: 1,
        status,
        responsibleUserId: "demo-user",
        validatedAt: status === "validada" ? new Date("2026-08-03T00:00:00.000Z") : null,
        validFrom: new Date("2026-08-01T00:00:00.000Z"),
        validUntil: index === 20 ? new Date("2026-08-02T00:00:00.000Z") : new Date("2027-08-01T00:00:00.000Z"),
        confidence: 0.7 + (index % 4) * 0.06
      }
    });
  }

  for (let index = 1; index <= 30; index += 1) {
    const ruleIndex = ((index - 1) % 14) + 1;
    const triggered = index % 3 === 0 || index % 5 === 0;
    await prisma.aiRuleEvaluation.upsert({
      where: { id: `ai-eval-${index}` },
      update: { result: triggered ? "activada" : "sin_hallazgo" },
      create: { id: `ai-eval-${index}`, organizationId: organization.id, permanentCode: `AI-EVL-${String(index).padStart(6, "0")}`, ruleId: `ai-rule-${ruleIndex}`, entityType: index % 2 === 0 ? "formulation_version" : "raw_material_lot", entityId: index % 2 === 0 ? approvedVersionForSales ?? "formulation-demo" : `lot-demo-${String(((index - 1) % 25) + 1).padStart(2, "0")}`, result: triggered ? "activada" : "sin_hallazgo", severity: index % 5 === 0 ? "alta" : "media", evidenceJson: { source: `kde-doc-${String(ruleIndex).padStart(3, "0")}`, reason: triggered ? "Condicion demo activada." : "Sin hallazgo demo." }, evaluatedByUserId: "demo-user", ruleVersionNumber: 1, evaluatedDataJson: { availableQuantity: index, status: index % 5 === 0 ? "cuarentena" : "aprobado", totalPercentage: index % 3 === 0 ? 98 : 100 } }
    });
  }

  for (let index = 1; index <= 12; index += 1) {
    await prisma.aiAlert.upsert({
      where: { id: `ai-alert-${index}` },
      update: { status: index % 4 === 0 ? "cerrada" : "abierta" },
      create: { id: `ai-alert-${index}`, organizationId: organization.id, permanentCode: `AI-ALT-${String(index).padStart(6, "0")}`, ruleId: `ai-rule-${((index - 1) % 14) + 1}`, evaluationId: `ai-eval-${index}`, entityType: index % 2 === 0 ? "sales_order" : "raw_material_lot", entityId: index % 2 === 0 ? `sales-order-${((index - 1) % 5) + 1}` : `lot-demo-${String(index).padStart(2, "0")}`, detected: "Alerta demo explicable activada.", explanation: "La condicion estructurada coincidio con datos registrados; requiere validacion humana.", source: `kde-doc-${String(index).padStart(3, "0")}`, confidence: 0.72 + (index % 3) * 0.05, severity: index % 4 === 0 ? "critica" : "media", suggestedAction: "Revisar evidencia, validar responsable y documentar decision.", validationResponsible: "demo-user", outputType: index === 12 ? "informacion_insuficiente" : "alerta", status: index % 4 === 0 ? "cerrada" : "abierta", evidenceDocumentId: `kde-doc-${String(index).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 15; index += 1) {
    const insufficient = index % 5 === 0;
    await prisma.aiQuery.upsert({
      where: { id: `ai-query-${index}` },
      update: { queryText: insufficient ? "Pregunta demo sin evidencia suficiente" : "En que formulaciones se usa SCI" },
      create: { id: `ai-query-${index}`, organizationId: organization.id, permanentCode: `AI-QRY-${String(index).padStart(6, "0")}`, queryText: insufficient ? "Pregunta demo sin evidencia suficiente" : "En que formulaciones se usa SCI", moduleScope: index % 2 === 0 ? "formulaciones" : "documentos", entityType: index % 3 === 0 ? "raw_material_master" : null, entityId: index % 3 === 0 ? "rm-sci" : null, userId: "demo-user" }
    });
    await prisma.aiResponse.upsert({
      where: { id: `ai-response-${index}` },
      update: { validationStatus: "no_validada" },
      create: { id: `ai-response-${index}`, organizationId: organization.id, permanentCode: `AI-RSP-${String(index).padStart(6, "0")}`, queryId: `ai-query-${index}`, answer: insufficient ? "Información insuficiente para evaluar" : "Respuesta demo basada en documentos, materias primas y relaciones registradas.", sourcesJson: insufficient ? [] : [{ type: "documento", id: `kde-doc-${String(index).padStart(3, "0")}`, title: "Documento demo", validationStatus: "procesado" }], documentsJson: insufficient ? [] : [{ id: `kde-doc-${String(index).padStart(3, "0")}`, name: "Documento demo" }], fragmentsJson: insufficient ? [] : [{ documentId: `kde-doc-${String(index).padStart(3, "0")}`, reference: "fragmento demo", text: "Fragmento demo de evidencia." }], confidence: insufficient ? 0.2 : 0.78, informationDate: new Date("2026-08-03T00:00:00.000Z"), warningsJson: insufficient ? ["No hay evidencia suficiente."] : ["Respuesta no validada automaticamente."], validationStatus: "no_validada", outputType: insufficient ? "informacion_insuficiente" : "dato_documental", documentId: insufficient ? null : `kde-doc-${String(index).padStart(3, "0")}` }
    });
  }

  for (let index = 1; index <= 10; index += 1) {
    await prisma.learningEvent.upsert({
      where: { id: `ai-learning-${index}` },
      update: { reviewStatus: index % 3 === 0 ? "revisado" : "pendiente" },
      create: { id: `ai-learning-${index}`, organizationId: organization.id, permanentCode: `AI-LRN-${String(index).padStart(6, "0")}`, context: ["correccion_campo", "rechazo_sugerencia", "validacion_respuesta", "correccion_relacion"][index % 4], inputJson: { original: "dato demo" }, proposedOutputJson: { propuesta: "salida demo" }, correctionJson: { correccion: "ajuste humano documentado" }, userId: "demo-user", entityType: index % 2 === 0 ? "ai_response" : "extracted_value", entityId: index % 2 === 0 ? `ai-response-${index}` : `value-demo-${index}`, modelOrRule: `ai-rule-${((index - 1) % 10) + 1}`, reviewStatus: index % 3 === 0 ? "revisado" : "pendiente" }
    });
  }

  const sourceTypes = ["norma_vigente", "fabricante", "metodo_validado", "interno_aprobado", "articulo_cientifico", "proveedor", "material_comercial", "no_validado", "proveedor_ia", "rag_logico"];
  for (let index = 1; index <= 10; index += 1) {
    await prisma.aiSourceConfig.upsert({
      where: { id: `ai-source-${index}` },
      update: { status: index === 8 ? "observacion" : "activo" },
      create: { id: `ai-source-${index}`, organizationId: organization.id, permanentCode: `AI-SRC-${String(index).padStart(6, "0")}`, sourceType: sourceTypes[index - 1], author: index === 9 ? "Proveedor configurable" : "Autor demo", sourceOrganization: index === 1 ? "Norma vigente demo" : "Formula Lab Demo", sourceDate: new Date("2026-08-01T00:00:00.000Z"), validUntil: index === 8 ? new Date("2026-08-02T00:00:00.000Z") : new Date("2027-08-01T00:00:00.000Z"), confidence: 0.55 + index * 0.04, priority: index, status: index === 8 ? "observacion" : "activo", responsibleUserId: "demo-user", lastReviewedAt: new Date("2026-08-03T00:00:00.000Z"), provider: index === 9 ? "configurable" : null, model: index === 9 ? "sin_clave_demo" : null, endpoint: index === 9 ? "configurado_por_entorno" : null, limitsJson: index === 9 ? { dailyQueries: 100 } : null, costPolicyJson: index === 9 ? { mode: "preparado" } : null, usagePolicy: "No guardar claves en frontend ni repositorio. No responder sin evidencia tecnica.", environment: "demo", documentId: `kde-doc-${String(index).padStart(3, "0")}` }
    });
  }

  const biDashboards = [
    ["general", "Tablero Ejecutivo Formula Lab"],
    ["formulaciones", "Formulaciones y versiones"],
    ["materias", "Materias primas maestras"],
    ["inventario", "Inventario y caducidades"],
    ["produccion", "Laboratorio y produccion"],
    ["calidad", "Calidad y liberaciones"],
    ["compras", "Compras y abastecimiento"],
    ["ventas", "CRM, ventas y pedidos"]
  ] as const;
  for (const [index, [module, name]] of biDashboards.entries()) {
    await prisma.biDashboard.upsert({
      where: { id: `bi-dashboard-${index + 1}` },
      update: { name, module, status: "activo" },
      create: { id: `bi-dashboard-${index + 1}`, organizationId: organization.id, permanentCode: `BI-DSH-${String(index + 1).padStart(6, "0")}`, name, module, description: "Dashboard demo construido con datos operativos persistidos.", configJson: { cards: ["indicadores", "tendencias", "alertas"], chart: index % 2 === 0 ? "bar" : "line" }, filtersJson: { period: "mes_actual", organizationId: organization.id }, status: "activo" }
    });
  }

  const reportEntities = ["formulations", "raw_materials", "inventory", "production", "quality", "purchases", "sales", "ai", "documents", "inventory", "sales", "quality"] as const;
  for (let index = 1; index <= 12; index += 1) {
    const entity = reportEntities[index - 1];
    await prisma.biReport.upsert({
      where: { id: `bi-report-${index}` },
      update: { title: `Reporte BI demo ${index}`, status: "activo" },
      create: { id: `bi-report-${index}`, organizationId: organization.id, permanentCode: `BI-RPT-${String(index).padStart(6, "0")}`, title: `Reporte BI demo ${index}`, description: "Reporte configurable sin SQL en frontend.", module: entity === "raw_materials" ? "materias" : entity, entity, fieldsJson: ["permanentCode", "status", "createdAt"], filtersJson: { period: "2026-08", status: "todos" }, groupByJson: ["status"], orderJson: { createdAt: "desc" }, periodJson: { start: "2026-08-01", end: "2026-08-31" }, format: index % 4 === 0 ? "json" : index % 3 === 0 ? "xlsx" : index % 2 === 0 ? "pdf" : "csv", columnsJson: ["Codigo", "Estado", "Fecha"], totalsJson: ["conteo"], createdByUserId: "demo-user", status: "activo" }
    });
  }

  for (let index = 1; index <= 6; index += 1) {
    await prisma.biSnapshot.upsert({
      where: { id: `bi-snapshot-${index}` },
      update: { metricKey: ["ventas_estimadas", "valor_inventario", "ordenes_activas", "alertas_criticas", "rendimiento_promedio", "compras_abiertas"][index - 1] },
      create: { id: `bi-snapshot-${index}`, organizationId: organization.id, permanentCode: `BI-SNP-${String(index).padStart(6, "0")}`, module: ["ventas", "inventario", "produccion", "ia", "produccion", "compras"][index - 1], metricKey: ["ventas_estimadas", "valor_inventario", "ordenes_activas", "alertas_criticas", "rendimiento_promedio", "compras_abiertas"][index - 1], periodStart: new Date(`2026-0${Math.min(index + 2, 8)}-01T00:00:00.000Z`), periodEnd: new Date(`2026-0${Math.min(index + 2, 8)}-28T23:59:59.000Z`), valueJson: { value: 1200 * index, unit: index === 2 ? "MXN" : "conteo" }, sourceJson: { tables: ["operational"], calculation: "snapshot demo fechado; no recalculado automaticamente" } }
    });
  }

  const biAlertModules = ["inventario", "calidad", "produccion", "ventas", "compras", "ia", "formulaciones", "materias", "documentos", "costos"] as const;
  for (let index = 1; index <= 10; index += 1) {
    await prisma.biExecutiveAlert.upsert({
      where: { id: `bi-alert-${index}` },
      update: { status: index % 4 === 0 ? "cerrada" : "abierta" },
      create: { id: `bi-alert-${index}`, organizationId: organization.id, permanentCode: `BI-ALT-${String(index).padStart(6, "0")}`, module: biAlertModules[index - 1], alertType: index % 2 === 0 ? "riesgo_operativo" : "seguimiento_ejecutivo", title: `Alerta ejecutiva demo ${index}`, detected: "Hallazgo construido desde datos existentes del ERP.", criterion: "Criterio demo documentado: conteo, estado, vencimiento o variacion registrada supera el umbral configurado.", source: `Fuente demo: tablas operativas del modulo ${biAlertModules[index - 1]} y snapshot BI-SNP-${String(((index - 1) % 6) + 1).padStart(6, "0")}.`, severity: index % 5 === 0 ? "critica" : index % 3 === 0 ? "alta" : "media", entityType: index % 2 === 0 ? "raw_material_lot" : "sales_order", entityId: index % 2 === 0 ? `lot-demo-${String(index).padStart(2, "0")}` : `sales-order-${((index - 1) % 5) + 1}`, status: index % 4 === 0 ? "cerrada" : "abierta" }
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    await prisma.biExport.upsert({
      where: { id: `bi-export-${index}` },
      update: { rowCount: 10 + index },
      create: { id: `bi-export-${index}`, organizationId: organization.id, permanentCode: `BI-EXP-${String(index).padStart(6, "0")}`, reportId: `bi-report-${index}`, module: biAlertModules[index - 1], format: ["csv", "xlsx", "pdf", "json"][index - 1] as "csv" | "xlsx" | "pdf" | "json", filtersJson: { period: "2026-08", demo: true }, rowCount: 10 + index, storagePath: `exports/BI-EXP-${String(index).padStart(6, "0")}.${["csv", "xlsx", "pdf", "json"][index - 1]}`, exportedByUserId: "demo-user" }
    });
  }

  for (let index = 1; index <= 3; index += 1) {
    await prisma.biSchedule.upsert({
      where: { id: `bi-schedule-${index}` },
      update: { status: "preparado" },
      create: { id: `bi-schedule-${index}`, organizationId: organization.id, permanentCode: `BI-SCH-${String(index).padStart(6, "0")}`, reportId: `bi-report-${index}`, frequency: ["semanal", "mensual", "trimestral"][index - 1], responsibleUserId: "demo-user", nextRunAt: new Date(`2026-09-0${index}T08:00:00.000Z`), status: "preparado" }
    });
  }

  await syncGraph(organization.id, "demo-user");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await graphPrisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await graphPrisma.$disconnect();
    process.exit(1);
  });
