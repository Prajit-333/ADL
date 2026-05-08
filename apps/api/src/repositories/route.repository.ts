import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class RouteRepository {
  async create(data: Prisma.RouteCreateInput) {
    return prisma.route.create({ data });
  }

  async findAll() {
    return prisma.route.findMany({
      include: {
        _count: { select: { stops: true } },
        stops: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.route.findUnique({
      where: { id },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.route.findUnique({ where: { code } });
  }

  async update(id: string, data: Prisma.RouteUpdateInput) {
    return prisma.route.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.route.delete({ where: { id } });
  }
}
