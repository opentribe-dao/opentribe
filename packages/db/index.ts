import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import ws from "ws";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = keys().DATABASE_URL;
const isLocalDatabase =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1") ||
  databaseUrl.includes("postgres:");

let database: PrismaClient;

if (isLocalDatabase) {
  // Local development with standard PostgreSQL adapter (Prisma 7)
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  database = globalForPrisma.prisma || new PrismaClient({ adapter });
} else {
  // Production with Neon serverless
  neonConfig.webSocketConstructor = ws;
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  database = globalForPrisma.prisma || new PrismaClient({ adapter });
}

export { database };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

export * from "./generated/client";
