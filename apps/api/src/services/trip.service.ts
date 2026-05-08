import { TripRepository } from '../repositories/trip.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { RouteRepository } from '../repositories/route.repository';
import { ApiError } from '../utils/ApiError';
import { TripStatus } from 'db/client';

export class TripService {
  private repository: TripRepository;
  private vehicleRepository: VehicleRepository;
  private routeRepository: RouteRepository;

  constructor() {
    this.repository = new TripRepository();
    this.vehicleRepository = new VehicleRepository();
    this.routeRepository = new RouteRepository();
  }

  async startTrip(data: { vehicleId: string; routeId: string }) {
    // 1. Validate vehicle exists
    const vehicle = await this.vehicleRepository.findById(data.vehicleId);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');

    // 2. Validate route exists
    const route = await this.routeRepository.findById(data.routeId);
    if (!route) throw new ApiError(404, 'Route not found');

    // 3. Auto-handle existing active trips for this vehicle
    const activeTrip = await this.repository.findActiveTripByVehicle(data.vehicleId);
    if (activeTrip) {
      // If it's already the same route, just return it
      if (activeTrip.routeId === data.routeId) {
        return activeTrip;
      }
      // If it's a different route, end the previous trip automatically
      await this.endTrip(activeTrip.id);
    }

    return this.repository.create({
      vehicleId: data.vehicleId,
      routeId: data.routeId,
      status: TripStatus.RUNNING,
      startedAt: new Date()
    });
  }

  async endTrip(tripId: string) {
    const trip = await this.repository.findById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');
    if (trip.status !== TripStatus.RUNNING) {
      throw new ApiError(400, 'Trip is not in RUNNING status');
    }

    return this.repository.update(tripId, {
      status: TripStatus.COMPLETED,
      endedAt: new Date()
    });
  }

  async getAllTrips() {
    return this.repository.findAll();
  }

  async getTripById(id: string) {
    const trip = await this.repository.findById(id);
    if (!trip) throw new ApiError(404, 'Trip not found');
    return trip;
  }
}
