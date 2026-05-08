import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class VehicleAssignmentRepository {
  async create(data: Prisma.VehicleAssignmentUncheckedCreateInput) {
    return prisma.vehicleAssignment.create({ data });
  }

  async findAll() {
    return prisma.vehicleAssignment.findMany({
      include: {
        vehicle: true,
        driver: { include: { user: { select: { name: true } } } },
        route: true
      },
      orderBy: { startDate: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.vehicleAssignment.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: { include: { user: { select: { name: true } } } },
        route: true
      }
    });
  }

  async findActiveAssignment(vehicleId: string) {
    return prisma.vehicleAssignment.findFirst({
      where: {
        vehicleId,
        endDate: null
      }
    });
  }

  async update(id: string, data: Prisma.VehicleAssignmentUpdateInput) {
    return prisma.vehicleAssignment.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.vehicleAssignment.delete({
      where: { id }
    });
  }

  async findActiveAssignmentByDriver(driverId: string) {
    return prisma.vehicleAssignment.findFirst({
      where: {
        driverId,
        endDate: null
      },
      include: {
        vehicle: true,
        route: {
          include: {
            stops: { orderBy: { sequence: 'asc' } }
          }
        }
      }
    });
  }
}
