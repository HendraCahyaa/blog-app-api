import { execSync } from "node:child_process";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

beforeAll(() => {
  execSync("npx prisma migrate reset --force");
});

beforeEach(async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
