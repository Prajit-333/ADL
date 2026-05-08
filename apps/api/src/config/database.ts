import { PrismaService } from 'db/client';

const prismaService = new PrismaService();
const prisma = prismaService.getClient();

export { prisma, prismaService };
