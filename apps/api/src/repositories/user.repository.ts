import { prisma } from '../config/database';
import { Prisma } from 'db/client';

export class UserRepository {
  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({ 
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        collegeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async findAll(collegeId?: string) {
    return prisma.user.findMany({
      where: collegeId ? { collegeId } : {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        collegeId: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        college: {
          select: { name: true }
        },
        driverProfile: true
      }
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    });
  }
}
