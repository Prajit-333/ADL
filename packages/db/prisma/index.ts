import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export class PrismaService {
  private readonly prisma: PrismaClient;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ce4o9VBnqZyw@ep-ancient-field-amnbfkwr-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    const adapter = new PrismaPg({connectionString});
    this.prisma = new PrismaClient({ adapter });
  }

  async connect() {
    await this.prisma.$connect();
    console.log('✅ Prisma connected');
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('🔴 Prisma disconnected');
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}

export { PrismaClient, Prisma, UserRole, VehicleStatus, TripStatus } from '../generated/prisma/client';
