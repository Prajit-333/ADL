import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';
import bcrypt from 'bcrypt';

export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async createUser(data: Prisma.UserUncheckedCreateInput) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'Email already registered');
    }

    // Role-based college check (logic handled in validator already, but extra safety)
    if (data.role !== 'SUPER_ADMIN' && !data.collegeId) {
        throw new ApiError(400, 'College ID is required for this role');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.repository.create({
      ...data,
      password: hashedPassword
    });
  }

  async getAllUsers(collegeId?: string) {
    return this.repository.findAll(collegeId);
  }

  async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  async updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
    await this.getUserById(id);

    if (data.email) {
      const existing = await this.repository.findByEmail(data.email as string);
      if (existing && existing.id !== id) {
        throw new ApiError(400, 'Email already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password as string, 10);
    }

    return this.repository.update(id, data);
  }

  async deleteUser(id: string) {
    await this.getUserById(id);
    return this.repository.delete(id);
  }
}
