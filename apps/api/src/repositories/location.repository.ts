import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class LocationRepository {
  async create(data: Prisma.LocationHistoryUncheckedCreateInput) {
    return prisma.locationHistory.create({ data });
  }

  async findByVehicleId(vehicleId: string, limit = 50) {
    return prisma.locationHistory.findMany({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: {
        trip: { select: { status: true } }
      }
    });
  }

  async findByTripId(tripId: string) {
    return prisma.locationHistory.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' }
    });
  }

  async deleteOldRecords(beforeDate: Date) {
    return prisma.locationHistory.deleteMany({
      where: {
        recordedAt: { lt: beforeDate }
      }
    });
  }
}
