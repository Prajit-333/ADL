import { RouteRepository } from '../repositories/route.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class RouteService {
  private repository: RouteRepository;

  constructor() {
    this.repository = new RouteRepository();
  }

  async createRoute(data: { code: string; city: string; startLocation?: string; destinationLocation?: string }) {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ApiError(400, 'Route with this code already exists');
    }
    return this.repository.create(data as Prisma.RouteCreateInput);
  }

  async getAllRoutes() {
    return this.repository.findAll();
  }

  async getRouteById(id: string) {
    const route = await this.repository.findById(id);
    if (!route) throw new ApiError(404, 'Route not found');
    return route;
  }

  async updateRoute(id: string, data: Prisma.RouteUpdateInput) {
    await this.getRouteById(id);
    if (data.code && typeof data.code === 'string') {
      const existing = await this.repository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new ApiError(400, 'Route code already in use');
      }
    }
    return this.repository.update(id, data);
  }

  async deleteRoute(id: string) {
    await this.getRouteById(id);
    return this.repository.delete(id);
  }
}
