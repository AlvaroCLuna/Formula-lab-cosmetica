import { z } from "zod";

const nodeSchema = z.object({
  nodeKey: z.string().min(2),
  nodeType: z.string().min(2),
  label: z.string().min(2),
  positionX: z.number().default(120),
  positionY: z.number().default(120),
  config: z.record(z.unknown()).default({}),
  groupKey: z.string().optional().nullable()
});

const edgeSchema = z.object({
  edgeKey: z.string().min(2),
  fromNodeKey: z.string().min(2),
  toNodeKey: z.string().min(2),
  label: z.string().optional().nullable(),
  condition: z.record(z.unknown()).default({})
});

export const studioSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  module: z.string().optional()
});

export const createWorkflowSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  categoryCode: z.string().optional(),
  moduleScope: z.string().default("transversal"),
  nodes: z.array(nodeSchema).min(2),
  edges: z.array(edgeSchema).default([])
});

export const startWorkflowInstanceSchema = z.object({
  workflowDefinitionId: z.string().min(1),
  workflowVersionId: z.string().min(1),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  input: z.record(z.unknown()).default({})
});
