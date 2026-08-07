import { Prisma, type GraphEntity } from "@prisma/client";
import { prisma } from "../db.js";

type EntitySeed = {
  sourceEntityType: string;
  sourceEntityId: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  module: string;
  summary?: string | null;
  responsibleUserId?: string | null;
  kpis?: Record<string, unknown>;
};

const entityTypeSeeds = [
  ["materia_prima", "Materia Prima", "materias"],
  ["proveedor", "Proveedor", "compras"],
  ["producto_comercial", "Producto Comercial", "costos"],
  ["documento", "Documento", "documentos"],
  ["formulacion", "Formulacion", "formulaciones"],
  ["version", "Version", "formulaciones"],
  ["proyecto_lims", "Proyecto LIMS", "lims"],
  ["muestra", "Muestra", "lims"],
  ["ensayo", "Ensayo", "lims"],
  ["metodo", "Metodo", "lims"],
  ["instrumento", "Instrumento", "lims"],
  ["orden_produccion", "Orden de Produccion", "produccion"],
  ["lote", "Lote", "inventario"],
  ["producto_terminado", "Producto Terminado", "produccion"],
  ["especificacion", "Especificacion", "calidad"],
  ["no_conformidad", "No Conformidad", "calidad"],
  ["capa", "CAPA", "calidad"],
  ["cotizacion", "Cotizacion", "ventas"],
  ["pedido", "Pedido", "ventas"],
  ["cliente", "Cliente", "ventas"],
  ["proyecto", "Proyecto", "conocimiento"],
  ["workflow", "Workflow Studio", "studio"],
  ["instancia_workflow", "Instancia Workflow", "studio"],
  ["usuario", "Usuario", "seguridad"],
  ["organizacion", "Organizacion", "seguridad"]
] as const;

const relationTypeSeeds = ["usa", "genera", "contiene", "requiere", "sustituye", "aprueba", "rechaza", "documenta", "produce", "consume", "compara", "referencia", "depende", "afecta", "relacionado_con"] as const;

async function nextCode(organizationId: string, prefix: string, model: "entity" | "relation" | "event" | "timeline" | "view") {
  const count =
    model === "entity" ? await prisma.graphEntity.count({ where: { organizationId } }) :
    model === "relation" ? await prisma.graphEntityRelation.count({ where: { organizationId } }) :
    model === "event" ? await prisma.graphEntityEvent.count({ where: { organizationId } }) :
    model === "timeline" ? await prisma.graphEntityTimeline.count({ where: { organizationId } }) :
    await prisma.graphEntityView.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export async function ensureGraphCatalogs(organizationId: string) {
  for (const [code, name, module] of entityTypeSeeds) {
    await prisma.graphEntityType.upsert({
      where: { organizationId_code: { organizationId, code } },
      update: { name, module, status: "activo" },
      create: { organizationId, code, name, module, description: `Tipo de entidad transversal ${name}.`, icon: "node", color: "#0f766e" }
    });
  }
  for (const code of relationTypeSeeds) {
    await prisma.graphRelationType.upsert({
      where: { organizationId_code: { organizationId, code } },
      update: { name: code.replace(/_/g, " "), status: "activo" },
      create: { organizationId, code, name: code.replace(/_/g, " "), description: `Relacion tipificada ${code}.`, bidirectionalDefault: code === "relacionado_con" }
    });
  }
}

async function upsertTwin(organizationId: string, seed: EntitySeed) {
  const type = await prisma.graphEntityType.findUniqueOrThrow({ where: { organizationId_code: { organizationId, code: seed.sourceEntityType } } });
  const existing = await prisma.graphEntity.findUnique({ where: { organizationId_sourceEntityType_sourceEntityId: { organizationId, sourceEntityType: seed.sourceEntityType, sourceEntityId: seed.sourceEntityId } } });
  return prisma.graphEntity.upsert({
    where: { organizationId_sourceEntityType_sourceEntityId: { organizationId, sourceEntityType: seed.sourceEntityType, sourceEntityId: seed.sourceEntityId } },
    update: { title: seed.title, subtitle: seed.subtitle, status: seed.status ?? "activo", module: seed.module, summary: seed.summary, kpisJson: (seed.kpis ?? {}) as Prisma.InputJsonValue, responsibleUserId: seed.responsibleUserId, lastSyncedAt: new Date() },
    create: { organizationId, entityTypeId: type.id, permanentCode: existing?.permanentCode ?? await nextCode(organizationId, "DTW", "entity"), sourceEntityType: seed.sourceEntityType, sourceEntityId: seed.sourceEntityId, title: seed.title, subtitle: seed.subtitle, status: seed.status ?? "activo", module: seed.module, summary: seed.summary, tagsJson: [seed.module, seed.sourceEntityType], kpisJson: (seed.kpis ?? {}) as Prisma.InputJsonValue, responsibleUserId: seed.responsibleUserId, lastSyncedAt: new Date() }
  });
}

async function relate(organizationId: string, userId: string, from: GraphEntity | null, to: GraphEntity | null, relationTypeCode: string, evidence: string, metadata: Record<string, unknown> = {}) {
  if (!from || !to || from.id === to.id) return null;
  const type = await prisma.graphRelationType.findUniqueOrThrow({ where: { organizationId_code: { organizationId, code: relationTypeCode } } });
  const existing = await prisma.graphEntityRelation.findUnique({ where: { organizationId_relationTypeId_fromEntityId_toEntityId: { organizationId, relationTypeId: type.id, fromEntityId: from.id, toEntityId: to.id } } });
  return prisma.graphEntityRelation.upsert({
    where: { organizationId_relationTypeId_fromEntityId_toEntityId: { organizationId, relationTypeId: type.id, fromEntityId: from.id, toEntityId: to.id } },
    update: { status: "activa", evidence, metadataJson: metadata as Prisma.InputJsonValue },
    create: { organizationId, permanentCode: existing?.permanentCode ?? await nextCode(organizationId, "REL", "relation"), relationTypeId: type.id, fromEntityId: from.id, toEntityId: to.id, direction: "directa", weight: 1, status: "activa", evidence, metadataJson: metadata as Prisma.InputJsonValue, createdByUserId: userId }
  });
}

export async function syncGraph(organizationId: string, userId: string) {
  await ensureGraphCatalogs(organizationId);
  const [organization, users, rawMaterials, suppliers, products, documents, formulations, versions, projects, samples, tests, methods, instruments, orders, lots, finishedLots, specs, ncfs, capas, quotes, salesOrders, customers, aiAlerts, biAlerts, workflows, workflowInstances] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.user.findMany({ where: { organizationId }, take: 10 }),
    prisma.rawMaterialMaster.findMany({ where: { organizationId }, take: 30 }),
    prisma.rawMaterialSupplier.findMany({ where: { organizationId }, take: 30 }),
    prisma.rawMaterialCommercialProduct.findMany({ where: { organizationId }, take: 30 }),
    prisma.document.findMany({ where: { organizationId }, take: 50 }),
    prisma.formulationFamily.findMany({ where: { organizationId }, take: 20 }),
    prisma.formulationVersion.findMany({ where: { organizationId }, take: 20 }),
    prisma.labProject.findMany({ where: { organizationId }, take: 20 }),
    prisma.labSample.findMany({ where: { organizationId }, take: 20 }),
    prisma.labTest.findMany({ where: { organizationId }, take: 20 }),
    prisma.labTestMethod.findMany({ where: { organizationId }, take: 20 }),
    prisma.labInstrument.findMany({ where: { organizationId }, take: 20 }),
    prisma.productionOrder.findMany({ where: { organizationId }, take: 20 }),
    prisma.rawMaterialLot.findMany({ where: { organizationId }, take: 30 }),
    prisma.finishedProductLot.findMany({ where: { organizationId }, take: 20 }),
    prisma.qualitySpecification.findMany({ where: { organizationId }, take: 20 }),
    prisma.qualityNonConformity.findMany({ where: { organizationId }, take: 20 }),
    prisma.qualityCapaAction.findMany({ where: { organizationId }, take: 20 }),
    prisma.salesQuote.findMany({ where: { organizationId }, take: 20 }),
    prisma.salesOrder.findMany({ where: { organizationId }, take: 20 }),
    prisma.crmCustomer.findMany({ where: { organizationId }, take: 20 }),
    prisma.aiAlert.findMany({ where: { organizationId }, take: 20 }),
    prisma.biExecutiveAlert.findMany({ where: { organizationId }, take: 20 }),
    prisma.workflowDefinition.findMany({ where: { organizationId }, take: 40 }),
    prisma.workflowInstance.findMany({ where: { organizationId }, include: { definition: true }, take: 40 })
  ]);

  const entityMap = new Map<string, GraphEntity>();
  const add = async (seed: EntitySeed) => {
    const entity = await upsertTwin(organizationId, seed);
    entityMap.set(`${seed.sourceEntityType}:${seed.sourceEntityId}`, entity);
    return entity;
  };

  if (organization) await add({ sourceEntityType: "organizacion", sourceEntityId: organization.id, title: organization.name, status: organization.status, module: "seguridad", summary: "Organizacion propietaria de los datos del ERP." });
  for (const user of users) await add({ sourceEntityType: "usuario", sourceEntityId: user.id, title: user.fullName, subtitle: user.email, status: user.status, module: "seguridad" });
  for (const item of rawMaterials) await add({ sourceEntityType: "materia_prima", sourceEntityId: item.id, title: item.commonName, subtitle: item.inci, status: item.status, module: "materias", summary: item.cosmeticFunction, responsibleUserId: item.createdByUserId });
  for (const item of suppliers) await add({ sourceEntityType: "proveedor", sourceEntityId: item.id, title: item.name, subtitle: item.contact, status: item.status, module: "compras" });
  for (const item of products) await add({ sourceEntityType: "producto_comercial", sourceEntityId: item.id, title: item.tradeName, subtitle: item.permanentCode, status: item.status, module: "costos", kpis: { price: Number(item.price), currency: item.currency } });
  for (const item of documents) await add({ sourceEntityType: "documento", sourceEntityId: item.id, title: item.title ?? item.originalFilename, subtitle: item.knowledgeCode ?? item.permanentCode, status: item.status, module: "documentos", summary: item.summary });
  for (const item of formulations) await add({ sourceEntityType: "formulacion", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.status, module: "formulaciones", responsibleUserId: item.createdByUserId });
  for (const item of versions) await add({ sourceEntityType: "version", sourceEntityId: item.id, title: item.name, subtitle: `Version ${item.versionNumber}`, status: item.status, module: "formulaciones", responsibleUserId: item.createdByUserId });
  for (const item of projects) await add({ sourceEntityType: "proyecto_lims", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.status, module: "lims", responsibleUserId: item.responsibleUserId });
  for (const item of samples) await add({ sourceEntityType: "muestra", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.pilotLotCode, status: item.status, module: "lims", responsibleUserId: item.responsibleUserId });
  for (const item of tests) await add({ sourceEntityType: "ensayo", sourceEntityId: item.id, title: item.testType, subtitle: item.permanentCode, status: item.status, module: "lims", responsibleUserId: item.analystUserId });
  for (const item of methods) await add({ sourceEntityType: "metodo", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.validationStatus, module: "lims", responsibleUserId: item.createdByUserId });
  for (const item of instruments) await add({ sourceEntityType: "instrumento", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.status, module: "lims", responsibleUserId: item.responsibleUserId });
  for (const item of orders) await add({ sourceEntityType: "orden_produccion", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.targetLotCode, status: item.status, module: "produccion", responsibleUserId: item.responsibleUserId, kpis: { plannedQuantity: Number(item.plannedQuantity), actualYield: item.actualYield ? Number(item.actualYield) : null } });
  for (const item of lots) await add({ sourceEntityType: "lote", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.supplierLotNumber, status: item.status, module: "inventario", kpis: { available: Number(item.availableQuantity), reserved: Number(item.reservedQuantity), unit: item.unit } });
  for (const item of finishedLots) await add({ sourceEntityType: "producto_terminado", sourceEntityId: item.id, title: item.lotCode, subtitle: item.productionOrderId, status: "activo", module: "produccion", responsibleUserId: item.responsibleUserId });
  for (const item of specs) await add({ sourceEntityType: "especificacion", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.status, module: "calidad", responsibleUserId: item.responsibleUserId });
  for (const item of ncfs) await add({ sourceEntityType: "no_conformidad", sourceEntityId: item.id, title: item.ncfType, subtitle: item.permanentCode, status: item.status, module: "calidad", summary: item.description, responsibleUserId: item.responsibleUserId });
  for (const item of capas) await add({ sourceEntityType: "capa", sourceEntityId: item.id, title: item.actionType, subtitle: item.permanentCode, status: item.status, module: "calidad", summary: item.actionText, responsibleUserId: item.responsibleUserId });
  for (const item of quotes) await add({ sourceEntityType: "cotizacion", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.status, status: item.status, module: "ventas", kpis: { total: Number(item.total), currency: item.currency } });
  for (const item of salesOrders) await add({ sourceEntityType: "pedido", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.status, status: item.status, module: "ventas", responsibleUserId: item.responsibleUserId, kpis: { total: Number(item.total), currency: item.currency } });
  for (const item of customers) await add({ sourceEntityType: "cliente", sourceEntityId: item.id, title: item.commercialName, subtitle: item.permanentCode, status: item.status, module: "ventas" });
  for (const item of workflows) await add({ sourceEntityType: "workflow", sourceEntityId: item.id, title: item.name, subtitle: item.permanentCode, status: item.status, module: "studio", summary: item.description, responsibleUserId: item.authorUserId });
  for (const item of workflowInstances) await add({ sourceEntityType: "instancia_workflow", sourceEntityId: item.id, title: item.permanentCode, subtitle: item.definition.name, status: item.status, module: "studio", responsibleUserId: item.startedByUserId, kpis: { currentNode: item.currentNodeKey } });

  for (const product of products) {
    await relate(organizationId, userId, entityMap.get(`producto_comercial:${product.id}`) ?? null, entityMap.get(`materia_prima:${product.rawMaterialMasterId}`) ?? null, "referencia", "Producto comercial vinculado a materia prima maestra por tabla raw_material_commercial_products.", { source: "seed_sync" });
    await relate(organizationId, userId, entityMap.get(`producto_comercial:${product.id}`) ?? null, entityMap.get(`proveedor:${product.supplierId}`) ?? null, "depende", "Producto comercial vinculado a proveedor registrado.", { source: "seed_sync" });
  }
  for (const version of versions) await relate(organizationId, userId, entityMap.get(`formulacion:${version.formulationFamilyId}`) ?? null, entityMap.get(`version:${version.id}`) ?? null, "contiene", "Version perteneciente a formulacion.", { version: version.versionNumber });
  for (const lot of lots) await relate(organizationId, userId, entityMap.get(`lote:${lot.id}`) ?? null, entityMap.get(`materia_prima:${lot.rawMaterialMasterId}`) ?? null, "contiene", "Lote relacionado con materia prima maestra.", { status: lot.status });
  for (const order of orders) await relate(organizationId, userId, entityMap.get(`orden_produccion:${order.id}`) ?? null, entityMap.get(`version:${order.formulationVersionId}`) ?? null, "produce", "Orden generada desde version aprobada de formulacion.", { lotCode: order.targetLotCode });
  for (const sample of samples) if (sample.projectId) await relate(organizationId, userId, entityMap.get(`proyecto_lims:${sample.projectId}`) ?? null, entityMap.get(`muestra:${sample.id}`) ?? null, "contiene", "Muestra vinculada a proyecto LIMS.", {});
  for (const test of tests) await relate(organizationId, userId, entityMap.get(`muestra:${test.sampleId}`) ?? null, entityMap.get(`ensayo:${test.id}`) ?? null, "requiere", "Ensayo asignado a muestra LIMS.", {});
  for (const quote of quotes) await relate(organizationId, userId, entityMap.get(`cliente:${quote.customerId}`) ?? null, entityMap.get(`cotizacion:${quote.id}`) ?? null, "referencia", "Cotizacion comercial vinculada a cliente.", {});
  for (const order of salesOrders) await relate(organizationId, userId, entityMap.get(`cliente:${order.customerId}`) ?? null, entityMap.get(`pedido:${order.id}`) ?? null, "requiere", "Pedido comercial vinculado a cliente.", {});
  for (const instance of workflowInstances) await relate(organizationId, userId, entityMap.get(`workflow:${instance.workflowDefinitionId}`) ?? null, entityMap.get(`instancia_workflow:${instance.id}`) ?? null, "genera", "Instancia generada desde Formula Lab Studio.", { status: instance.status });
  for (const alert of aiAlerts) await relate(organizationId, userId, entityMap.get(`${alert.entityType === "raw_material_lot" ? "lote" : "pedido"}:${alert.entityId}`) ?? null, entityMap.get(`documento:${alert.evidenceDocumentId}`) ?? null, "documenta", "Alerta IA con evidencia documental registrada.", { alert: alert.permanentCode });
  for (const alert of biAlerts) await relate(organizationId, userId, entityMap.get(`${alert.entityType === "raw_material_lot" ? "lote" : "pedido"}:${alert.entityId}`) ?? null, null, "afecta", alert.source, { alert: alert.permanentCode });

  const entities = await prisma.graphEntity.findMany({ where: { organizationId }, orderBy: { permanentCode: "asc" } });
  for (const [index, entity] of entities.entries()) {
    await prisma.graphEntityTimeline.upsert({
      where: { permanentCode: `TML-${String(index + 1).padStart(6, "0")}` },
      update: { action: "sincronizado" },
      create: { organizationId, permanentCode: `TML-${String(index + 1).padStart(6, "0")}`, entityId: entity.id, eventAt: new Date("2026-08-03T12:00:00.000Z"), userId, module: entity.module, action: "sincronizado", objectType: entity.sourceEntityType, objectId: entity.sourceEntityId, result: "Gemelo digital actualizado", evidence: "Sincronizacion desde datos operativos existentes.", metadataJson: { source: "syncGraph" } }
    });
    await prisma.graphEntityEvent.upsert({
      where: { permanentCode: `EVT-${String(index + 1).padStart(6, "0")}` },
      update: { title: "Evento de sincronizacion" },
      create: { organizationId, permanentCode: `EVT-${String(index + 1).padStart(6, "0")}`, entityId: entity.id, eventType: "sincronizacion", title: "Evento de sincronizacion", description: "Evento demo generado para timeline universal.", severity: "informativa", sourceModule: entity.module, sourceType: entity.sourceEntityType, sourceId: entity.sourceEntityId, userId, evidence: "Datos existentes del ERP." }
    });
    await prisma.graphEntitySnapshot.upsert({
      where: { permanentCode: `GRF-SNP-${String(index + 1).padStart(6, "0")}` },
      update: { payloadJson: { title: entity.title, status: entity.status } },
      create: { organizationId, permanentCode: `GRF-SNP-${String(index + 1).padStart(6, "0")}`, entityId: entity.id, snapshotType: "vista_360", payloadJson: { title: entity.title, status: entity.status, module: entity.module }, sourceJson: { tables: ["entities", "entity_relations"], note: "Snapshot demo fechado." } }
    });
    await prisma.graphEntityMetric.upsert({
      where: { organizationId_entityId_metricKey: { organizationId, entityId: entity.id, metricKey: "relaciones_activas" } },
      update: { valueJson: { value: await prisma.graphEntityRelation.count({ where: { organizationId, status: "activa", OR: [{ fromEntityId: entity.id }, { toEntityId: entity.id }] } }) } },
      create: { organizationId, entityId: entity.id, metricKey: "relaciones_activas", label: "Relaciones activas", valueJson: { value: 0 }, source: "Conteo de entity_relations activas." }
    });
  }

  const firstEntity = entities[0];
  if (firstEntity) {
    for (const [index, viewKind] of (["gemelo", "grafo", "arbol", "timeline", "tabla", "tarjetas", "vista_360"] as const).entries()) {
      await prisma.graphEntityView.upsert({
        where: { permanentCode: `GRF-${String(index + 1).padStart(6, "0")}` },
        update: { status: "activo" },
        create: { organizationId, permanentCode: `GRF-${String(index + 1).padStart(6, "0")}`, entityId: firstEntity.id, viewKind, name: `Vista ${viewKind}`, configJson: { layout: viewKind, depth: 2 } }
      });
    }
  }

  return dashboardGraph(organizationId);
}

export async function dashboardGraph(organizationId: string) {
  const [entities, relations, orphanNodes, documents, documentsRelated, rawMaterials, products, lots, lotsWithDocs, newRelations] = await Promise.all([
    prisma.graphEntity.count({ where: { organizationId } }),
    prisma.graphEntityRelation.count({ where: { organizationId, status: "activa" } }),
    prisma.graphEntity.count({ where: { organizationId, outgoingRelations: { none: { status: "activa" } }, incomingRelations: { none: { status: "activa" } } } }),
    prisma.graphEntity.count({ where: { organizationId, sourceEntityType: "documento" } }),
    prisma.graphEntityRelation.count({ where: { organizationId, relationType: { code: "documenta" }, status: "activa" } }),
    prisma.graphEntity.count({ where: { organizationId, sourceEntityType: "materia_prima" } }),
    prisma.graphEntity.count({ where: { organizationId, sourceEntityType: "producto_comercial" } }),
    prisma.graphEntity.count({ where: { organizationId, sourceEntityType: "lote" } }),
    prisma.graphEntityRelation.count({ where: { organizationId, relationType: { code: "documenta" }, fromEntity: { sourceEntityType: "lote" }, status: "activa" } }),
    prisma.graphEntityRelation.count({ where: { organizationId, createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } } })
  ]);
  return {
    indicators: {
      entities,
      relations,
      orphanNodes,
      documentsWithoutRelation: Math.max(documents - documentsRelated, 0),
      rawMaterialsWithoutCost: Math.max(rawMaterials - products, 0),
      lotsWithoutCoa: Math.max(lots - lotsWithDocs, 0),
      newRelations,
      brokenRelations: await prisma.graphEntityRelation.count({ where: { organizationId, status: { in: ["inactiva", "obsoleta"] } } })
    }
  };
}

export async function searchGraph(organizationId: string, filters: { q?: string; type?: string; module?: string }) {
  const entities = await prisma.graphEntity.findMany({
    where: {
      organizationId,
      ...(filters.module ? { module: filters.module } : {}),
      ...(filters.type ? { sourceEntityType: filters.type } : {}),
      ...(filters.q ? { OR: [{ title: { contains: filters.q } }, { subtitle: { contains: filters.q } }, { permanentCode: { contains: filters.q } }] } : {})
    },
    include: { entityType: true, metrics: true },
    orderBy: { updatedAt: "desc" },
    take: 80
  });
  return { entities };
}

export async function graphForEntity(organizationId: string, entityId?: string, depth = 2) {
  const where = entityId ? { organizationId, OR: [{ fromEntityId: entityId }, { toEntityId: entityId }] } : { organizationId };
  const relations = await prisma.graphEntityRelation.findMany({ where: { ...where, status: "activa" }, include: { relationType: true, fromEntity: true, toEntity: true }, take: entityId ? depth * 60 : 120, orderBy: { updatedAt: "desc" } });
  const nodes = new Map<string, GraphEntity>();
  relations.forEach((relation) => { nodes.set(relation.fromEntity.id, relation.fromEntity); nodes.set(relation.toEntity.id, relation.toEntity); });
  if (entityId && !nodes.has(entityId)) {
    const entity = await prisma.graphEntity.findFirst({ where: { organizationId, id: entityId } });
    if (entity) nodes.set(entity.id, entity);
  }
  return {
    nodes: Array.from(nodes.values()),
    edges: relations.map((relation) => ({ id: relation.id, code: relation.permanentCode, from: relation.fromEntityId, to: relation.toEntityId, type: relation.relationType.code, label: relation.relationType.name, status: relation.status, evidence: relation.evidence }))
  };
}

export async function twin360(organizationId: string, entityId: string) {
  const entity = await prisma.graphEntity.findFirstOrThrow({ where: { organizationId, id: entityId }, include: { entityType: true, metrics: true, snapshots: { orderBy: { capturedAt: "desc" }, take: 5 }, timeline: { orderBy: { eventAt: "desc" }, take: 12 }, events: { orderBy: { createdAt: "desc" }, take: 12 } } });
  const graph = await graphForEntity(organizationId, entityId, 2);
  const alerts = await prisma.aiAlert.findMany({ where: { organizationId, entityType: entity.sourceEntityType, entityId: entity.sourceEntityId }, take: 8, orderBy: { createdAt: "desc" } });
  const audit = await prisma.auditLog.findMany({ where: { organizationId, entityType: entity.sourceEntityType, entityId: entity.sourceEntityId }, take: 8, orderBy: { createdAt: "desc" } });
  return { entity, graph, alerts, audit };
}

export async function createGraphRelation(input: { organizationId: string; userId: string; fromEntityId: string; toEntityId: string; relationTypeCode: string; direction: string; weight: number; evidence: string; evidenceDocumentId?: string | null; metadata: Record<string, unknown> }) {
  const type = await prisma.graphRelationType.findUniqueOrThrow({ where: { organizationId_code: { organizationId: input.organizationId, code: input.relationTypeCode } } });
  const existing = await prisma.graphEntityRelation.findUnique({ where: { organizationId_relationTypeId_fromEntityId_toEntityId: { organizationId: input.organizationId, relationTypeId: type.id, fromEntityId: input.fromEntityId, toEntityId: input.toEntityId } } });
  if (existing) return existing;
  return prisma.graphEntityRelation.create({
    data: { organizationId: input.organizationId, permanentCode: await nextCode(input.organizationId, "REL", "relation"), relationTypeId: type.id, fromEntityId: input.fromEntityId, toEntityId: input.toEntityId, direction: input.direction, weight: input.weight, evidence: input.evidence, evidenceDocumentId: input.evidenceDocumentId, metadataJson: input.metadata as Prisma.InputJsonValue, createdByUserId: input.userId }
  });
}
