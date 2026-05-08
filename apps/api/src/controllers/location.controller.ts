import type { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class LocationController {
  private service: LocationService;

  constructor() {
    this.service = new LocationService();
  }

  public updateLocation = catchAsync(async (req: Request, res: Response) => {
    const location = await this.service.updateLocation(req.body);
    res.status(201).send(new ApiResponse(location, 'Location updated successfully'));
  });

  public getVehicleHistory = catchAsync(async (req: Request, res: Response) => {
    const history = await this.service.getVehicleHistory(req.params.id as string);
    res.send(new ApiResponse(history));
  });

  public getTripHistory = catchAsync(async (req: Request, res: Response) => {
    const history = await this.service.getTripHistory(req.params.tripId as string);
    res.send(new ApiResponse(history));
  });
}
