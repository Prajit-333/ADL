import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class DriverProfileRepository {
  async create(data: Prisma.DriverProfileUncheckedCreateInput) {
    return prisma.driverProfile.create({ data });
  }

  async findAll() {
    return prisma.driverProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        assignedRoute: { select: { id: true, code: true, city: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        vehicles: {
          include: {
            vehicle: true,
            route: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.driverProfile.findUnique({ where: { userId } });
  }

  async update(id: string, data: Prisma.DriverProfileUncheckedUpdateInput) {
    return prisma.driverProfile.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.driverProfile.delete({ where: { id } });
  }
}
