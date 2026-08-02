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
    { id: "rm-sci", permanentCode: "MP-0001", commonName: "SCI", inci: "Sodium Cocoyl Isethionate" },
    { id: "rm-betaina", permanentCode: "MP-0002", commonName: "Betaina de coco", inci: "Cocamidopropyl Betaine" },
    { id: "rm-karite", permanentCode: "MP-0003", commonName: "Manteca de karite", inci: "Butyrospermum Parkii Butter" },
    { id: "rm-jojoba", permanentCode: "MP-0004", commonName: "Aceite de jojoba", inci: "Simmondsia Chinensis Seed Oil" },
    { id: "rm-kaolin", permanentCode: "MP-0005", commonName: "Arcilla blanca", inci: "Kaolin" },
    { id: "rm-pantenol", permanentCode: "MP-0006", commonName: "Pantenol", inci: "Panthenol" },
    { id: "rm-agua", permanentCode: "MP-0007", commonName: "Agua purificada", inci: "Aqua" }
  ];

  for (const material of rawMaterials) {
    await prisma.rawMaterialMaster.upsert({
      where: { organizationId_permanentCode: { organizationId: organization.id, permanentCode: material.permanentCode } },
      update: { commonName: material.commonName, inci: material.inci, status: "activo" },
      create: { ...material, organizationId: organization.id, status: "activo" }
    });
  }

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
