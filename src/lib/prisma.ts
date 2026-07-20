import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const adapter = new PrismaPg({
    connectionString,
    ssl: shouldUseDatabaseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function shouldUseDatabaseSsl(connectionString: string) {
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  try {
    const databaseUrl = new URL(connectionString);
    const sslMode = databaseUrl.searchParams.get("sslmode");

    if (sslMode === "disable") {
      return false;
    }

    if (sslMode) {
      return true;
    }
  } catch {
    return process.env.NODE_ENV === "production";
  }

  return process.env.DATABASE_SSL === "true" || process.env.NODE_ENV === "production";
}
