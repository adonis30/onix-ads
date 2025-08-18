import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export { prisma };   // named export
export default prisma; // default export
