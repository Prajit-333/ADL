import { CollegeRepository } from '../repositories/college.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class CollegeService {
  private repository: CollegeRepository;

  constructor() {
    this.repository = new CollegeRepository();
  }

  async createCollege(data: Prisma.CollegeCreateInput) {
    if (data.domain) {
      const existing = await this.repository.findByDomain(data.domain);
      if (existing) {
        throw new ApiError(400, 'College with this domain already exists');
      }
    }
    return this.repository.create(data);
  }

  async getAllColleges() {
    return this.repository.findAll();
  }

  async getCollegeById(id: string) {
    const college = await this.repository.findById(id);
    if (!college) {
      throw new ApiError(404, 'College not found');
    }
    return college;
  }

  async updateCollege(id: string, data: Prisma.CollegeUpdateInput) {
    await this.getCollegeById(id);
    
    if (data.domain && typeof data.domain === 'string') {
      const existing = await this.repository.findByDomain(data.domain);
      if (existing && existing.id !== id) {
        throw new ApiError(400, 'Another college already uses this domain');
      }
    }
    
    return this.repository.update(id, data);
  }

  async deleteCollege(id: string) {
    await this.getCollegeById(id);
    return this.repository.delete(id);
  }
}
