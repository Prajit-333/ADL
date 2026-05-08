import { VehicleRepository } from '../repositories/vehicle.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class VehicleService {
  private repository: VehicleRepository;

  constructor() {
    this.repository = new VehicleRepository();
  }

  async createVehicle(data: { registration: string; type: string; capacity: number; status?: string }) {
    const existingReg = await this.repository.findByRegistration(data.registration);
    if (existingReg) {
      throw new ApiError(400, 'Vehicle with this registration already exists');
    }
    return this.repository.create(data as unknown as Prisma.VehicleUncheckedCreateInput);
  }

  async getAllVehicles() {
    return this.repository.findAll();
  }

  async getVehicleById(id: string) {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    return vehicle;
  }

  async updateVehicle(id: string, data: Prisma.VehicleUpdateInput) {
    await this.getVehicleById(id);
    if (data.registration && typeof data.registration === 'string') {
      const existing = await this.repository.findByRegistration(data.registration);
      if (existing && existing.id !== id) {
        throw new ApiError(400, 'Registration already in use');
      }
    }
    return this.repository.update(id, data);
  }

  async deleteVehicle(id: string) {
    await this.getVehicleById(id);
    return this.repository.delete(id);
  }
}
