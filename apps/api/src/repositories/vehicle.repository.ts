import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class VehicleRepository {
  async create(data: Prisma.VehicleUncheckedCreateInput) {
    return prisma.vehicle.create({ data });
  }

  async findAll() {
    return prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            driver: { include: { user: { select: { name: true } } } },
            route: true,
          },
        },
      },
    });
  }

  async findByRegistration(registration: string) {
    return prisma.vehicle.findUnique({ where: { registration } });
  }

  async update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  }
}
