import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class CollegeRepository {
  async create(data: Prisma.CollegeCreateInput) {
    return prisma.college.create({ data });
  }

  async findAll() {
    return prisma.college.findMany();
  }

  async findById(id: string) {
    return prisma.college.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, vehicles: true, routes: true }
        }
      }
    });
  }

  async findByDomain(domain: string) {
    return prisma.college.findUnique({
      where: { domain }
    });
  }

  async update(id: string, data: Prisma.CollegeUpdateInput) {
    return prisma.college.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.college.delete({
      where: { id }
    });
  }

  async softDelete(id: string) {
    return prisma.college.update({
      where: { id },
      data: { isActive: false }
    });
  }
}
