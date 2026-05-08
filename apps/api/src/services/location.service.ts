import { LocationRepository } from '../repositories/location.repository';
import { TripRepository } from '../repositories/trip.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { ApiError } from '../utils/ApiError';
import { Prisma } from 'db/client';
import { publishLocation } from '../config/kafka';

export class LocationService {
  private repository: LocationRepository;
  private tripRepository: TripRepository;
  private vehicleRepository: VehicleRepository;

  constructor() {
    this.repository = new LocationRepository();
    this.tripRepository = new TripRepository();
    this.vehicleRepository = new VehicleRepository();
  }

  async updateLocation(data: Prisma.LocationHistoryUncheckedCreateInput) {
    // 1. Validate vehicle
    const vehicle = await this.vehicleRepository.findById(data.vehicleId);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');

    // 2. Automagically find active trip if tripId not provided
    let finalTripId = data.tripId;
    if (!finalTripId) {
      const activeTrip = await this.tripRepository.findActiveTripByVehicle(data.vehicleId);
      if (activeTrip) {
        finalTripId = activeTrip.id;
      }
    }

    const location = await this.repository.create({
      ...data,
      tripId: finalTripId,
      recordedAt: new Date()
    });

    // Resolve routeId from the active trip so passengers can filter by route
    let routeId: string | undefined;
    if (finalTripId) {
      const trip = await this.tripRepository.findActiveTripByVehicle(data.vehicleId);
      routeId = trip?.routeId ?? undefined;
    }

    // Async publish to Kafka for real-time tracking (full payload for passengers)
    publishLocation({
      ...location,
      registration: vehicle.registration,
      routeId,
    });

    return location;
  }

  async getVehicleHistory(vehicleId: string) {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    return this.repository.findByVehicleId(vehicleId);
  }

  async getTripHistory(tripId: string) {
    return this.repository.findByTripId(tripId);
  }
}
