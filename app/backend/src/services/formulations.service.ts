import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

export async function generatePermanentCode(organizationId: string) {
  const count = await prisma.formulationFamily.count({ where: { organizationId } });
  return `FLC-FRM-${String(count + 1).padStart(6, "0")}`;
}

export function buildFormulationWhere(input: { organizationId: string; search?: string; status?: string; category?: string }) {
  const where: Prisma.FormulationFamilyWhereInput = {
    organizationId: input.organizationId
  };

  if (input.status) {
    where.status = input.status as Prisma.EnumFormulationFamilyStatusFilter["equals"];
  }

  if (input.category) {
    where.category = { contains: input.category };
  }

  if (input.search) {
    where.OR = [
      { permanentCode: { contains: input.search } },
      { name: { contains: input.search } },
      { category: { contains: input.search } },
      {
        versions: {
          some: {
            ingredients: {
              some: {
                displayName: { contains: input.search }
              }
            }
          }
        }
      }
    ];
  }

  return where;
}

export async function listFormulations(input: { organizationId: string; search?: string; status?: string; category?: string }) {
  return prisma.formulationFamily.findMany({
    where: buildFormulationWhere(input),
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { ingredients: { where: { status: "activo" }, orderBy: { orderIndex: "asc" } } }
      }
    }
  });
}
