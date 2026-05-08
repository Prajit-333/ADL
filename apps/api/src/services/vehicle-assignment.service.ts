import { VehicleAssignmentRepository } from '../repositories/vehicle-assignment.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { DriverProfileRepository } from '../repositories/driver-profile.repository';
import { RouteRepository } from '../repositories/route.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';

export class VehicleAssignmentService {
  private repository: VehicleAssignmentRepository;
  private vehicleRepository: VehicleRepository;
  private driverRepository: DriverProfileRepository;
  private routeRepository: RouteRepository;

  constructor() {
    this.repository = new VehicleAssignmentRepository();
    this.vehicleRepository = new VehicleRepository();
    this.driverRepository = new DriverProfileRepository();
    this.routeRepository = new RouteRepository();
  }

  async createAssignment(data: Prisma.VehicleAssignmentUncheckedCreateInput) {
    // Validate entities exist
    const vehicle = await this.vehicleRepository.findById(data.vehicleId);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');

    const driver = await this.driverRepository.findById(data.driverId);
    if (!driver) throw new ApiError(404, 'Driver profile not found');

    const route = await this.routeRepository.findById(data.routeId);
    if (!route) throw new ApiError(404, 'Route not found');

    // Prevent duplicate active assignment for the same vehicle
    const active = await this.repository.findActiveAssignment(data.vehicleId);
    if (active) {
      throw new ApiError(400, 'This vehicle already has an active assignment. End it before creating a new one.');
    }

    return this.repository.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null
    });
  }

  async getAllAssignments() {
    return this.repository.findAll();
  }

  async getAssignmentById(id: string) {
    const assignment = await this.repository.findById(id);
    if (!assignment) {
      throw new ApiError(404, 'Vehicle assignment not found');
    }
    return assignment;
  }

  async updateAssignment(id: string, data: Prisma.VehicleAssignmentUncheckedUpdateInput) {
    await this.getAssignmentById(id);

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate as string);
    if (data.endDate) updateData.endDate = new Date(data.endDate as string);

    return this.repository.update(id, updateData);
  }

  async deleteAssignment(id: string) {
    await this.getAssignmentById(id);
    return this.repository.delete(id);
  }

  async getAssignmentByDriverId(userId: string) {
    const profile = await this.driverRepository.findByUserId(userId);
    if (!profile) return null;

    const assignment = await this.repository.findActiveAssignmentByDriver(profile.id);
    
    if (assignment) return assignment;

    // Fallback: If no vehicle is assigned, return the static route/stop from the profile
    if (profile.assignedRouteId) {
      const route = await this.routeRepository.findById(profile.assignedRouteId);
      return {
        driverId: profile.id,
        routeId: profile.assignedRouteId,
        route: route,
        vehicle: { registration: 'TBD', type: 'Assigned' } // Placeholder for UI
      };
    }

    return null;
  }
}
