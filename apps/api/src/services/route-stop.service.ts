import { RouteStopRepository } from '../repositories/route-stop.repository';
import { RouteRepository } from '../repositories/route.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class RouteStopService {
  private repository: RouteStopRepository;
  private routeRepository: RouteRepository;

  constructor() {
    this.repository = new RouteStopRepository();
    this.routeRepository = new RouteRepository();
  }

  async addStop(data: Prisma.RouteStopUncheckedCreateInput) {
    const route = await this.routeRepository.findById(data.routeId);
    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    const existingSequence = await this.repository.findBySequence(data.routeId, data.sequence);
    if (existingSequence) {
      throw new ApiError(400, `Stop with sequence ${data.sequence} already exists for this route`);
    }

    return this.repository.create(data);
  }

  async getStopsByRoute(routeId: string) {
    return this.repository.findByRouteId(routeId);
  }

  async getStopById(id: string) {
    const stop = await this.repository.findById(id);
    if (!stop) {
      throw new ApiError(404, 'Route stop not found');
    }
    return stop;
  }

  async updateStop(id: string, data: Prisma.RouteStopUncheckedUpdateInput) {
    const original = await this.getStopById(id);
    
    if (data.sequence !== undefined && data.sequence !== original.sequence) {
      const routeId = (data.routeId as string) || original.routeId;
      const existingSequence = await this.repository.findBySequence(routeId, data.sequence as number);
      if (existingSequence && existingSequence.id !== id) {
        throw new ApiError(400, `Another stop already has sequence ${data.sequence}`);
      }
    }

    return this.repository.update(id, data);
  }

  async deleteStop(id: string) {
    await this.getStopById(id);
    return this.repository.delete(id);
  }
}
