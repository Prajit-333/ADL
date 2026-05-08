import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class RouteStopRepository {
  async create(data: Prisma.RouteStopUncheckedCreateInput) {
    return prisma.routeStop.create({ data });
  }

  async findByRouteId(routeId: string) {
    return prisma.routeStop.findMany({
      where: { routeId },
      orderBy: { sequence: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.routeStop.findUnique({
      where: { id }
    });
  }

  async findBySequence(routeId: string, sequence: number) {
    return prisma.routeStop.findUnique({
      where: {
        routeId_sequence: { routeId, sequence }
      }
    });
  }

  async update(id: string, data: Prisma.RouteStopUpdateInput) {
    return prisma.routeStop.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.routeStop.delete({
      where: { id }
    });
  }
}
