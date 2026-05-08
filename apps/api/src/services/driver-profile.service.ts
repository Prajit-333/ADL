import { DriverProfileRepository } from '../repositories/driver-profile.repository';
import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class DriverProfileService {
  private repository: DriverProfileRepository;
  private userRepository: UserRepository;

  constructor() {
    this.repository = new DriverProfileRepository();
    this.userRepository = new UserRepository();
  }

  async createProfile(data: Prisma.DriverProfileUncheckedCreateInput) {
    // Check if user exists and has DRIVER role
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (user.role !== 'DRIVER') {
      throw new ApiError(400, 'User must have DRIVER role to have a profile');
    }

    // Prevent duplicate profile
    const existing = await this.repository.findByUserId(data.userId);
    if (existing) {
      throw new ApiError(400, 'Driver profile already exists for this user');
    }

    return this.repository.create(data);
  }

  async getAllProfiles() {
    return this.repository.findAll();
  }

  async getProfileById(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new ApiError(404, 'Driver profile not found');
    }
    return profile;
  }

  async updateProfile(id: string, data: Prisma.DriverProfileUpdateInput) {
    await this.getProfileById(id);
    return this.repository.update(id, data);
  }

  async deleteProfile(id: string) {
    await this.getProfileById(id);
    return this.repository.delete(id);
  }
}
