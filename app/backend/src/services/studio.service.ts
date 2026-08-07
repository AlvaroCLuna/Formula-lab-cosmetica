import { Prisma, type WorkflowEdge, type WorkflowNode } from "@prisma/client";
import { prisma } from "../db.js";

type StudioModel =
  | "workflowDefinition"
  | "dynamicForm"
  | "checklist"
  | "workflowEvent"
  | "workflowTemplate"
  | "workflowInstance"
  | "workflowMarketplace";

type WorkflowGraphNode = Pick<WorkflowNode, "nodeKey" | "nodeType" | "label">;
type WorkflowGraphEdge = Pick<WorkflowEdge, "fromNodeKey" | "toNodeKey" | "label">;

const codeConfig: Record<StudioModel, { prefix: string; count: (organizationId: string) => Promise<number> }> = {
  workflowDefinition: { prefix: "STU-WKF", count: (organizationId) => prisma.workflowDefinition.count({ where: { organizationId } }) },
  dynamicForm: { prefix: "STU-FRM", count: (organizationId) => prisma.dynamicForm.count({ where: { organizationId } }) },
  checklist: { prefix: "STU-CHK", count: (organizationId) => prisma.checklist.count({ where: { organizationId } }) },
  workflowEvent: { prefix: "STU-EVT", count: (organizationId) => prisma.workflowEvent.count({ where: { organizationId } }) },
  workflowTemplate: { prefix: "STU-TPL", count: (organizationId) => prisma.workflowTemplate.count({ where: { organizationId } }) },
  workflowInstance: { prefix: "STU-INS", count: (organizationId) => prisma.workflowInstance.count({ where: { organizationId } }) },
  workflowMarketplace: { prefix: "STU-ACT", count: (organizationId) => prisma.workflowMarketplace.count({ where: { organizationId } }) }
};

async function nextStudioCode(organizationId: string, model: StudioModel) {
  const config = codeConfig[model];
  return `${config.prefix}-${String((await config.count(organizationId)) + 1).padStart(6, "0")}`;
}

export function studioPalette() {
  return {
    categories: [
      { name: "Procesos", items: ["inicio", "fin", "tarea", "subproceso", "espera"] },
      { name: "Aprobaciones", items: ["aprobacion", "revision", "firma", "rechazo"] },
      { name: "Formularios", items: ["formulario", "campo", "checklist", "adjunto"] },
      { name: "Reglas", items: ["decision", "condicion", "temporizador", "variable"] },
      { name: "Acciones", items: ["notificacion", "consulta", "actualizacion", "webhook_preparado"] },
      { name: "Modulos", items: ["produccion", "laboratorio", "inventario", "calidad", "compras", "ventas", "bi"] },
      { name: "IA preparada", items: ["ia_preparada", "clasificador_preparado", "asistente_preparado"] }
    ]
  };
}

export function validateWorkflowGraph(nodes: WorkflowGraphNode[], edges: WorkflowGraphEdge[]) {
  const nodeKeys = new Set(nodes.map((node) => node.nodeKey));
  const errors: string[] = [];
  const warnings: string[] = [];
  const startNodes = nodes.filter((node) => node.nodeType === "inicio");
  const endNodes = nodes.filter((node) => node.nodeType === "fin");

  if (startNodes.length !== 1) errors.push("El flujo debe tener exactamente un nodo de inicio.");
  if (endNodes.length < 1) errors.push("El flujo debe tener al menos un nodo de fin.");

  for (const edge of edges) {
    if (!nodeKeys.has(edge.fromNodeKey)) errors.push(`La conexion ${edge.label ?? ""} sale de un nodo inexistente.`);
    if (!nodeKeys.has(edge.toNodeKey)) errors.push(`La conexion ${edge.label ?? ""} llega a un nodo inexistente.`);
  }

  const outgoing = new Map<string, string[]>();
  for (const edge of edges) outgoing.set(edge.fromNodeKey, [...(outgoing.get(edge.fromNodeKey) ?? []), edge.toNodeKey]);
  for (const node of nodes) {
    if (node.nodeType !== "fin" && (outgoing.get(node.nodeKey)?.length ?? 0) === 0) warnings.push(`${node.label} no tiene salida configurada.`);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const visit = (key: string): boolean => {
    if (stack.has(key)) return true;
    if (visited.has(key)) return false;
    visited.add(key);
    stack.add(key);
    for (const next of outgoing.get(key) ?? []) if (visit(next)) return true;
    stack.delete(key);
    return false;
  };
  if (startNodes[0] && visit(startNodes[0].nodeKey)) warnings.push("El flujo contiene un ciclo; se permite, pero requiere condicion de salida documentada.");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedMinutes: Math.max(5, nodes.length * 5 + edges.length * 2),
    path: buildPath(startNodes[0]?.nodeKey, outgoing, nodes)
  };
}

function buildPath(startKey: string | undefined, outgoing: Map<string, string[]>, nodes: WorkflowGraphNode[]) {
  if (!startKey) return [];
  const labels = new Map(nodes.map((node) => [node.nodeKey, node.label]));
  const path: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = startKey;
  while (current && !seen.has(current) && path.length < nodes.length + 2) {
    seen.add(current);
    path.push(labels.get(current) ?? current);
    current = outgoing.get(current)?.[0];
  }
  return path;
}

export async function studioDashboard(organizationId: string) {
  const [workflows, published, drafts, instances, running, errors, forms, checklists, templates, events] = await Promise.all([
    prisma.workflowDefinition.count({ where: { organizationId } }),
    prisma.workflowDefinition.count({ where: { organizationId, status: "publicado" } }),
    prisma.workflowDefinition.count({ where: { organizationId, status: "borrador" } }),
    prisma.workflowInstance.count({ where: { organizationId } }),
    prisma.workflowInstance.count({ where: { organizationId, status: "en_proceso" } }),
    prisma.workflowInstance.count({ where: { organizationId, status: "fallida" } }),
    prisma.dynamicForm.count({ where: { organizationId } }),
    prisma.checklist.count({ where: { organizationId } }),
    prisma.workflowTemplate.count({ where: { organizationId } }),
    prisma.workflowEvent.count({ where: { organizationId } })
  ]);
  return { indicators: { workflows, published, drafts, instances, running, errors, forms, checklists, templates, events } };
}

export async function listStudioWorkflows(organizationId: string, filters: { q?: string; status?: string; module?: string }) {
  const workflows = await prisma.workflowDefinition.findMany({
    where: {
      organizationId,
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.module ? { moduleScope: filters.module } : {}),
      ...(filters.q ? { OR: [{ name: { contains: filters.q } }, { permanentCode: { contains: filters.q } }, { description: { contains: filters.q } }] } : {})
    },
    include: { category: true, versions: { include: { nodes: true, edges: true }, orderBy: { versionNumber: "desc" }, take: 1 }, instances: { orderBy: { startedAt: "desc" }, take: 3 } },
    orderBy: { updatedAt: "desc" }
  });
  return { workflows };
}

export async function getStudioWorkflow(organizationId: string, id: string) {
  const workflow = await prisma.workflowDefinition.findFirstOrThrow({
    where: { organizationId, id },
    include: { category: true, versions: { include: { nodes: { orderBy: { positionY: "asc" } }, edges: true, templates: true }, orderBy: { versionNumber: "desc" } }, instances: { include: { logs: true }, orderBy: { startedAt: "desc" }, take: 10 }, events: true, permissions: true, marketplace: true }
  });
  return { workflow };
}

export async function createConfiguredWorkflow(input: { organizationId: string; userId: string; name: string; description?: string; categoryCode?: string; moduleScope: string; nodes: Array<any>; edges: Array<any> }) {
  const category = await prisma.workflowCategory.findFirst({ where: { organizationId: input.organizationId, code: input.categoryCode ?? "general" } });
  const permanentCode = await nextStudioCode(input.organizationId, "workflowDefinition");
  const validation = validateWorkflowGraph(input.nodes, input.edges);
  const workflow = await prisma.workflowDefinition.create({
    data: {
      organizationId: input.organizationId,
      categoryId: category?.id,
      permanentCode,
      name: input.name,
      description: input.description,
      moduleScope: input.moduleScope,
      status: "borrador",
      authorUserId: input.userId,
      tagsJson: [input.moduleScope, "configurable"],
      versions: {
        create: {
          organizationId: input.organizationId,
          permanentCode: `${permanentCode}-V001`,
          versionNumber: 1,
          status: "borrador",
          canvasJson: { nodes: input.nodes, edges: input.edges },
          configJson: { mode: "configurado", hardcoded: false },
          validationJson: validation as Prisma.InputJsonValue,
          authorUserId: input.userId,
          nodes: { create: input.nodes.map((node) => ({ organizationId: input.organizationId, nodeKey: node.nodeKey, nodeType: node.nodeType, label: node.label, positionX: node.positionX, positionY: node.positionY, configJson: node.config, groupKey: node.groupKey })) },
          edges: { create: input.edges.map((edge) => ({ organizationId: input.organizationId, edgeKey: edge.edgeKey, fromNodeKey: edge.fromNodeKey, toNodeKey: edge.toNodeKey, label: edge.label, conditionJson: edge.condition })) }
        }
      }
    },
    include: { versions: { include: { nodes: true, edges: true } } }
  });
  return workflow;
}

export async function simulateStudioVersion(organizationId: string, versionId: string) {
  const version = await prisma.workflowVersion.findFirstOrThrow({ where: { organizationId, id: versionId }, include: { nodes: true, edges: true } });
  const simulation = validateWorkflowGraph(version.nodes, version.edges);
  return { version, simulation };
}

export async function publishStudioVersion(organizationId: string, workflowId: string, versionId: string) {
  const { simulation } = await simulateStudioVersion(organizationId, versionId);
  if (!simulation.valid) throw new Error(`No se puede publicar: ${simulation.errors.join(" ")}`);
  const version = await prisma.workflowVersion.update({ where: { id: versionId }, data: { status: "publicado", publishedAt: new Date() } });
  const workflow = await prisma.workflowDefinition.update({ where: { id: workflowId }, data: { status: "publicado", currentVersionId: versionId } });
  return { workflow, version, simulation };
}

export async function startStudioInstance(input: { organizationId: string; userId: string; workflowDefinitionId: string; workflowVersionId: string; entityType?: string | null; entityId?: string | null; payload: Record<string, unknown> }) {
  const version = await prisma.workflowVersion.findFirstOrThrow({ where: { organizationId: input.organizationId, id: input.workflowVersionId }, include: { nodes: true, edges: true } });
  const firstNode = version.nodes.find((node) => node.nodeType === "inicio") ?? version.nodes[0];
  const instance = await prisma.workflowInstance.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: await nextStudioCode(input.organizationId, "workflowInstance"),
      workflowDefinitionId: input.workflowDefinitionId,
      workflowVersionId: input.workflowVersionId,
      currentNodeKey: firstNode?.nodeKey,
      status: "en_proceso",
      entityType: input.entityType,
      entityId: input.entityId,
      inputJson: input.payload as Prisma.InputJsonValue,
      startedByUserId: input.userId,
      logs: { create: { organizationId: input.organizationId, nodeKey: firstNode?.nodeKey ?? "inicio", action: "instancia_creada", result: "Workflow iniciado desde configuracion Studio.", userId: input.userId, metadataJson: { source: "studio" } } }
    },
    include: { definition: true, version: true, logs: true }
  });
  return { instance };
}

export async function syncStudioToGraph(organizationId: string, userId: string) {
  const workflowType = await prisma.graphEntityType.upsert({
    where: { organizationId_code: { organizationId, code: "workflow" } },
    update: { name: "Workflow Studio", module: "studio", status: "activo" },
    create: { organizationId, code: "workflow", name: "Workflow Studio", module: "studio", description: "Workflow configurable Formula Lab Studio.", icon: "workflow", color: "#0f766e" }
  });
  const instanceType = await prisma.graphEntityType.upsert({
    where: { organizationId_code: { organizationId, code: "instancia_workflow" } },
    update: { name: "Instancia Workflow", module: "studio", status: "activo" },
    create: { organizationId, code: "instancia_workflow", name: "Instancia Workflow", module: "studio", description: "Ejecucion trazable de workflow.", icon: "play", color: "#2563eb" }
  });

  const [workflows, instances] = await Promise.all([
    prisma.workflowDefinition.findMany({ where: { organizationId }, take: 80 }),
    prisma.workflowInstance.findMany({ where: { organizationId }, include: { definition: true }, take: 80, orderBy: { startedAt: "desc" } })
  ]);

  for (const workflow of workflows) {
    await prisma.graphEntity.upsert({
      where: { organizationId_sourceEntityType_sourceEntityId: { organizationId, sourceEntityType: "workflow", sourceEntityId: workflow.id } },
      update: { title: workflow.name, subtitle: workflow.permanentCode, status: workflow.status, module: "studio", lastSyncedAt: new Date() },
      create: { organizationId, entityTypeId: workflowType.id, permanentCode: workflow.permanentCode.replace("STU-WKF", "DTW-STU-WKF"), sourceEntityType: "workflow", sourceEntityId: workflow.id, title: workflow.name, subtitle: workflow.permanentCode, status: workflow.status, module: "studio", summary: workflow.description, tagsJson: ["studio", workflow.moduleScope], kpisJson: { module: workflow.moduleScope }, responsibleUserId: workflow.authorUserId, lastSyncedAt: new Date() }
    });
  }

  for (const instance of instances) {
    const entity = await prisma.graphEntity.upsert({
      where: { organizationId_sourceEntityType_sourceEntityId: { organizationId, sourceEntityType: "instancia_workflow", sourceEntityId: instance.id } },
      update: { title: instance.permanentCode, subtitle: instance.definition.name, status: instance.status, module: "studio", lastSyncedAt: new Date() },
      create: { organizationId, entityTypeId: instanceType.id, permanentCode: instance.permanentCode.replace("STU-INS", "DTW-STU-INS"), sourceEntityType: "instancia_workflow", sourceEntityId: instance.id, title: instance.permanentCode, subtitle: instance.definition.name, status: instance.status, module: "studio", summary: "Instancia de workflow trazable.", tagsJson: ["studio", "instancia"], kpisJson: { currentNode: instance.currentNodeKey }, responsibleUserId: instance.startedByUserId, lastSyncedAt: new Date() }
    });
    await prisma.graphEntityTimeline.upsert({
      where: { permanentCode: instance.permanentCode.replace("STU-INS", "TML") },
      update: { result: `Instancia ${instance.status}` },
      create: { organizationId, permanentCode: instance.permanentCode.replace("STU-INS", "TML"), entityId: entity.id, eventAt: instance.startedAt, userId, module: "studio", action: "workflow_iniciado", objectType: "instancia_workflow", objectId: instance.id, result: `Instancia ${instance.status}`, evidence: "Registro workflow_instances y workflow_execution_log.", metadataJson: { workflowDefinitionId: instance.workflowDefinitionId } }
    });
  }

  return { workflows: workflows.length, instances: instances.length };
}

export async function seedStudioDemo(organizationId: string, userId: string) {
  const categories = [
    ["general", "General"], ["produccion", "Produccion"], ["laboratorio", "Laboratorio"], ["compras", "Compras"], ["calidad", "Calidad"], ["ventas", "Ventas"]
  ] as const;
  for (const [index, [code, name]] of categories.entries()) {
    await prisma.workflowCategory.upsert({
      where: { organizationId_code: { organizationId, code } },
      update: { name, status: "activo" },
      create: { id: `studio-category-${code}`, organizationId, code, name, description: `Categoria configurable ${name}.`, sortOrder: index + 1 }
    });
  }

  const modules = ["produccion", "laboratorio", "compras", "calidad", "ventas", "inventario", "documentos", "bi", "ia", "formulaciones", "materias", "general"];
  for (let index = 1; index <= 12; index += 1) {
    const moduleScope = modules[index - 1];
    const workflowId = `studio-workflow-${index}`;
    const versionId = `studio-workflow-${index}-v1`;
    const nodes = [
      { nodeKey: "inicio", nodeType: "inicio", label: "Inicio", positionX: 90, positionY: 120, config: { evento: "manual" } },
      { nodeKey: "formulario", nodeType: "formulario", label: "Captura de datos", positionX: 300, positionY: 120, config: { formCode: `STU-FRM-${String(((index - 1) % 8) + 1).padStart(6, "0")}` } },
      { nodeKey: "aprobacion", nodeType: "aprobacion", label: "Aprobacion responsable", positionX: 520, positionY: 120, config: { role: "responsable" } },
      { nodeKey: "fin", nodeType: "fin", label: "Cierre trazable", positionX: 740, positionY: 120, config: { audit: true } }
    ];
    const edges = [
      { edgeKey: "e1", fromNodeKey: "inicio", toNodeKey: "formulario", label: "crear", condition: {} },
      { edgeKey: "e2", fromNodeKey: "formulario", toNodeKey: "aprobacion", label: "validar", condition: { required: true } },
      { edgeKey: "e3", fromNodeKey: "aprobacion", toNodeKey: "fin", label: "aprobar", condition: { decision: "aprobado" } }
    ];
    await prisma.workflowDefinition.upsert({
      where: { id: workflowId },
      update: { name: `Workflow Studio ${moduleScope}`, status: index <= 9 ? "publicado" : "borrador" },
      create: { id: workflowId, organizationId, categoryId: `studio-category-${categories[index % categories.length][0]}`, permanentCode: `STU-WKF-${String(index).padStart(6, "0")}`, name: `Workflow Studio ${moduleScope}`, description: "Proceso demo configurado desde Formula Lab Studio.", moduleScope, status: index <= 9 ? "publicado" : "borrador", currentVersionId: versionId, authorUserId: userId, tagsJson: [moduleScope, "demo"] }
    });
    await prisma.workflowVersion.upsert({
      where: { id: versionId },
      update: { canvasJson: { nodes, edges }, validationJson: validateWorkflowGraph(nodes as any, edges as any) },
      create: { id: versionId, organizationId, workflowDefinitionId: workflowId, permanentCode: `STU-WKF-${String(index).padStart(6, "0")}-V001`, versionNumber: 1, status: index <= 9 ? "publicado" : "borrador", canvasJson: { nodes, edges }, configJson: { mode: "demo_configurado", moduleScope }, validationJson: validateWorkflowGraph(nodes as any, edges as any), authorUserId: userId, publishedAt: index <= 9 ? new Date("2026-08-03T10:00:00.000Z") : null }
    });
    for (const node of nodes) {
      await prisma.workflowNode.upsert({
        where: { workflowVersionId_nodeKey: { workflowVersionId: versionId, nodeKey: node.nodeKey } },
        update: { label: node.label, configJson: node.config },
        create: { organizationId, workflowVersionId: versionId, nodeKey: node.nodeKey, nodeType: node.nodeType, label: node.label, positionX: node.positionX, positionY: node.positionY, configJson: node.config }
      });
    }
    for (const edge of edges) {
      await prisma.workflowEdge.upsert({
        where: { workflowVersionId_edgeKey: { workflowVersionId: versionId, edgeKey: edge.edgeKey } },
        update: { label: edge.label, conditionJson: edge.condition },
        create: { organizationId, workflowVersionId: versionId, edgeKey: edge.edgeKey, fromNodeKey: edge.fromNodeKey, toNodeKey: edge.toNodeKey, label: edge.label, conditionJson: edge.condition }
      });
    }
  }

  for (let index = 1; index <= 8; index += 1) {
    await prisma.dynamicForm.upsert({
      where: { id: `studio-form-${index}` },
      update: { name: `Formulario dinamico ${index}` },
      create: { id: `studio-form-${index}`, organizationId, permanentCode: `STU-FRM-${String(index).padStart(6, "0")}`, name: `Formulario dinamico ${index}`, description: "Formulario demo versionado.", status: "publicado", currentVersionId: `studio-form-${index}-v1` }
    });
    await prisma.dynamicFormVersion.upsert({
      where: { id: `studio-form-${index}-v1` },
      update: { schemaJson: { fields: ["nombre", "responsable", "decision"] } },
      create: { id: `studio-form-${index}-v1`, organizationId, formId: `studio-form-${index}`, permanentCode: `STU-FRM-${String(index).padStart(6, "0")}-V001`, versionNumber: 1, schemaJson: { fields: ["nombre", "responsable", "decision"] }, status: "publicado", publishedAt: new Date("2026-08-03T10:00:00.000Z") }
    });
    for (const [fieldIndex, field] of ["nombre", "responsable", "decision"].entries()) {
      await prisma.dynamicFormField.upsert({
        where: { formId_fieldKey: { formId: `studio-form-${index}`, fieldKey: field } },
        update: { label: field },
        create: { organizationId, formId: `studio-form-${index}`, fieldKey: field, label: field, fieldType: field === "decision" ? "select" : "text", required: true, optionsJson: field === "decision" ? ["aprobar", "rechazar", "revisar"] : [], sortOrder: fieldIndex + 1 }
      });
    }
  }

  for (let index = 1; index <= 10; index += 1) {
    await prisma.checklist.upsert({
      where: { id: `studio-checklist-${index}` },
      update: { name: `Checklist Studio ${index}` },
      create: { id: `studio-checklist-${index}`, organizationId, permanentCode: `STU-CHK-${String(index).padStart(6, "0")}`, name: `Checklist Studio ${index}`, description: "Checklist demo configurable.", moduleScope: modules[index % modules.length], status: "publicado" }
    });
    for (let item = 1; item <= 4; item += 1) {
      await prisma.checklistItem.upsert({
        where: { id: `studio-checklist-${index}-item-${item}` },
        update: { required: item <= 2 },
        create: { id: `studio-checklist-${index}-item-${item}`, organizationId, checklistId: `studio-checklist-${index}`, section: "Control", question: `Punto configurable ${item}`, responseType: "booleano", required: item <= 2, configJson: { evidence: item === 4 }, sortOrder: item }
      });
    }
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.workflowTemplate.upsert({
      where: { id: `studio-template-${index}` },
      update: { name: `Plantilla Studio ${index}` },
      create: { id: `studio-template-${index}`, organizationId, permanentCode: `STU-TPL-${String(index).padStart(6, "0")}`, workflowVersionId: `studio-workflow-${index}-v1`, name: `Plantilla Studio ${index}`, templateType: ["bpm", "formulario", "aprobacion", "checklist", "dashboard"][index - 1], payloadJson: { reusable: true, module: modules[index - 1] }, status: "activo" }
    });
  }

  for (let index = 1; index <= 12; index += 1) {
    await prisma.workflowEvent.upsert({
      where: { id: `studio-event-${index}` },
      update: { status: "activo" },
      create: { id: `studio-event-${index}`, organizationId, permanentCode: `STU-EVT-${String(index).padStart(6, "0")}`, workflowDefinitionId: `studio-workflow-${((index - 1) % 12) + 1}`, eventType: ["manual", "estado", "aprobacion", "fecha"][index % 4], moduleScope: modules[index % modules.length], triggerConfigJson: { configured: true }, actionConfigJson: { type: "notificacion" }, status: "activo" }
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    await prisma.workflowVariable.upsert({
      where: { id: `studio-variable-${index}` },
      update: { status: "activo" },
      create: { id: `studio-variable-${index}`, organizationId, permanentCode: `STU-ACT-${String(index).padStart(6, "0")}`, scope: modules[index % modules.length], name: `variable_${index}`, dataType: index % 2 === 0 ? "numero" : "texto", defaultValueJson: index % 2 === 0 ? 0 : "", description: "Variable demo para reglas configuradas.", status: "activo" }
    });
  }

  for (let index = 1; index <= 20; index += 1) {
    const workflowIndex = ((index - 1) % 12) + 1;
    const status = index % 7 === 0 ? "fallida" : index % 5 === 0 ? "completada" : "en_proceso";
    await prisma.workflowInstance.upsert({
      where: { id: `studio-instance-${index}` },
      update: { status },
      create: { id: `studio-instance-${index}`, organizationId, permanentCode: `STU-INS-${String(index).padStart(6, "0")}`, workflowDefinitionId: `studio-workflow-${workflowIndex}`, workflowVersionId: `studio-workflow-${workflowIndex}-v1`, currentNodeKey: status === "completada" ? "fin" : "aprobacion", status, entityType: modules[index % modules.length], entityId: `demo-${index}`, inputJson: { demo: true }, outputJson: status === "completada" ? { decision: "aprobada" } : {}, errorMessage: status === "fallida" ? "Error demo controlado." : null, startedByUserId: userId, startedAt: new Date(`2026-08-03T${String(8 + (index % 8)).padStart(2, "0")}:00:00.000Z`), finishedAt: status === "completada" ? new Date(`2026-08-03T${String(9 + (index % 8)).padStart(2, "0")}:00:00.000Z`) : null }
    });
    await prisma.workflowExecutionLog.upsert({
      where: { id: `studio-instance-${index}-log` },
      update: { result: `Instancia ${status}` },
      create: { id: `studio-instance-${index}-log`, organizationId, workflowInstanceId: `studio-instance-${index}`, nodeKey: "inicio", action: "ejecucion_demo", result: `Instancia ${status}`, durationMs: 1200 + index * 80, errorMessage: status === "fallida" ? "Error demo controlado." : null, userId, metadataJson: { source: "seed" } }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.workflowMarketplace.upsert({
      where: { id: `studio-marketplace-${index}` },
      update: { status: "activo" },
      create: { id: `studio-marketplace-${index}`, organizationId, workflowDefinitionId: `studio-workflow-${index}`, permanentCode: `STU-ACT-${String(index + 20).padStart(6, "0")}`, itemType: "plantilla", name: `Accion reutilizable ${index}`, description: "Bloque reutilizable del Studio.", payloadJson: { type: "accion", configurable: true }, status: "activo" }
    });
  }
}
