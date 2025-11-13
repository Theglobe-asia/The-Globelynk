import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding (reset admin)…");

  const email = "admin@globelynk.app";
  const rawPassword = "Admin#2025";
  const password = bcrypt.hashSync(rawPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name: "Chef Admin", password, role: "ADMIN" },
    create: { name: "Chef Admin", email, password, role: "ADMIN" },
  });

  console.log("✅ Seed complete (admin ready):", email, "/", rawPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
