import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export class AdminController {

  /** Create User (DRIVER role) + DriverProfile in two sequential steps */
  public createDriver = catchAsync(async (req: Request, res: Response) => {
    const { email, password, name, phone, licenseNo, assignedRouteId } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(400, 'email, password, and name are required');
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, `A user with email "${email}" already exists`);

    // Hash password with Bun's built-in (no native binding issues)
    const hashed = await Bun.password.hash(password);

    // Step 1: create User
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: 'DRIVER',
      },
    });

    // Step 2: create DriverProfile (cleanup user if this fails)
    let profile;
    try {
      profile = await prisma.driverProfile.create({
        data: {
          userId: user.id,
          phone:           phone        || null,
          licenseNo:       licenseNo    || null,
          assignedRouteId: assignedRouteId || null,
        },
      });
    } catch (profileErr: any) {
      // Roll back the user to keep DB consistent
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      throw new ApiError(500, `Driver profile creation failed: ${profileErr.message}`);
    }

    res.status(201).send(new ApiResponse({ user, profile }, 'Driver created successfully'));
  });

  public getDrivers = catchAsync(async (req: Request, res: Response) => {
    const drivers = await prisma.driverProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
        assignedRoute: { select: { id: true, code: true, startLocation: true, destinationLocation: true } },
      },
    });
    res.send(new ApiResponse(drivers));
  });

  public deleteDriver = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const profile = await prisma.driverProfile.findUnique({ where: { id } });
    if (!profile) throw new ApiError(404, 'Driver not found');
    
    // Deleting the user will cascade to driver profile
    await prisma.user.delete({ where: { id: profile.userId } });
    res.send(new ApiResponse(null, 'Driver deleted successfully'));
  });

  public createRoute = catchAsync(async (req: Request, res: Response) => {
    const { code, city, startLocation, destinationLocation, startLat, startLng, destLat, destLng } = req.body;
    if (!code || !city) throw new ApiError(400, 'code and city are required');

    const existing = await prisma.route.findUnique({ where: { code } });
    if (existing) throw new ApiError(409, `Route with code "${code}" already exists`);

    const route = await prisma.route.create({ 
      data: { 
        code, 
        city, 
        startLocation: startLocation || null, 
        destinationLocation: destinationLocation || null,
        startLat: startLat ? parseFloat(startLat) : null,
        startLng: startLng ? parseFloat(startLng) : null,
        destLat: destLat ? parseFloat(destLat) : null,
        destLng: destLng ? parseFloat(destLng) : null,
      } 
    });
    res.status(201).send(new ApiResponse(route, 'Route created successfully'));
  });

  public deleteRoute = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    
    await prisma.$transaction(async (tx) => {
      // Unassign drivers
      await tx.driverProfile.updateMany({
        where: { assignedRouteId: id },
        data: { assignedRouteId: null }
      });

      // Delete route stops & driver stops
      const stops = await tx.routeStop.findMany({ where: { routeId: id } });
      const stopIds = stops.map(s => s.id);
      if (stopIds.length > 0) {
        await tx.driverStop.deleteMany({ where: { stopId: { in: stopIds } } });
        await tx.routeStop.deleteMany({ where: { routeId: id } });
      }

      // Delete vehicle assignments
      await tx.vehicleAssignment.deleteMany({ where: { routeId: id } });

      // Delete trips & location history
      const trips = await tx.trip.findMany({ where: { routeId: id } });
      const tripIds = trips.map(t => t.id);
      if (tripIds.length > 0) {
        await tx.locationHistory.deleteMany({ where: { tripId: { in: tripIds } } });
        await tx.trip.deleteMany({ where: { routeId: id } });
      }

      await tx.route.delete({ where: { id } });
    });

    res.send(new ApiResponse(null, 'Route deleted successfully'));
  });

  public createStop = catchAsync(async (req: Request, res: Response) => {
    const { routeId, name, latitude, longitude, sequence } = req.body;
    if (!routeId || !name || !latitude || !longitude || !sequence) {
      throw new ApiError(400, 'routeId, name, latitude, longitude, and sequence are required');
    }

    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new ApiError(404, 'Route not found');

    const stop = await prisma.routeStop.create({
      data: {
        routeId,
        name,
        latitude:  parseFloat(latitude),
        longitude: parseFloat(longitude),
        sequence:  parseInt(sequence),
      },
    });
    res.status(201).send(new ApiResponse(stop, 'Stop added successfully'));
  });

  public deleteStop = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await prisma.routeStop.delete({ where: { id } });
    res.send(new ApiResponse(null, 'Stop deleted successfully'));
  });

  /** Create a Vehicle Assignment: driver + vehicle + route */
  public createAssignment = catchAsync(async (req: Request, res: Response) => {
    const { driverId, vehicleId, routeId, startDate } = req.body;
    if (!driverId || !vehicleId || !routeId) {
      throw new ApiError(400, 'driverId, vehicleId, and routeId are required');
    }

    // Validate all three entities exist
    const [driver, vehicle, route] = await Promise.all([
      prisma.driverProfile.findUnique({ where: { id: driverId } }),
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.route.findUnique({ where: { id: routeId } }),
    ]);
    if (!driver)  throw new ApiError(404, 'Driver profile not found');
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    if (!route)   throw new ApiError(404, 'Route not found');

    // Prevent double-assignment of the same vehicle
    const activeAssignment = await prisma.vehicleAssignment.findFirst({
      where: { vehicleId, endDate: null },
    });
    if (activeAssignment) {
      throw new ApiError(400, 'This vehicle already has an active assignment. End it first.');
    }

    const assignment = await prisma.vehicleAssignment.create({
      data: {
        driverId,
        vehicleId,
        routeId,
        startDate: startDate ? new Date(startDate) : new Date(),
      },
      include: {
        driver:  { include: { user: { select: { name: true } } } },
        vehicle: { select: { id: true, registration: true, type: true } },
        route:   { select: { id: true, code: true, startLocation: true, destinationLocation: true } },
      },
    });

    res.status(201).send(new ApiResponse(assignment, 'Assignment created successfully'));
  });

  /** List all Vehicle Assignments */
  public getAssignments = catchAsync(async (req: Request, res: Response) => {
    const assignments = await prisma.vehicleAssignment.findMany({
      include: {
        driver:  { include: { user: { select: { name: true, email: true } } } },
        vehicle: { select: { id: true, registration: true, type: true } },
        route:   { select: { id: true, code: true, startLocation: true, destinationLocation: true } },
      },
    });
    res.send(new ApiResponse(assignments));
  });

  /** End an assignment by setting endDate to now */
  public endAssignment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const assignment = await prisma.vehicleAssignment.findUnique({ where: { id } });
    if (!assignment) throw new ApiError(404, 'Assignment not found');

    const updated = await prisma.vehicleAssignment.update({
      where: { id },
      data: { endDate: new Date() },
    });
    res.send(new ApiResponse(updated, 'Assignment ended successfully'));
  });

  public deleteAssignment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await prisma.vehicleAssignment.delete({ where: { id } });
    res.send(new ApiResponse(null, 'Assignment deleted successfully'));
  });
}
