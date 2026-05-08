import { z } from 'zod';

export const createVehicleAssignmentSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    driverId: z.string().uuid(),
    routeId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),
});

export const updateVehicleAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional(),
    routeId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const getVehicleAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
