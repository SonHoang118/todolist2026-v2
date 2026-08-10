import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const users = [
    { email: "alice@company.com", name: "Alice Nguyen" },
    { email: "bob@company.com", name: "Bob Tran" },
    { email: "charlie@company.com", name: "Charlie Le" },
    { email: "diana@company.com", name: "Diana Pham" },
    { email: "evan@company.com", name: "Evan Hoang" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    });
    console.log(`Seeded user: ${u.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
