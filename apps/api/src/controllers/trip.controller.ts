import type { Request, Response } from 'express';
import { TripService } from '../services/trip.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class TripController {
  private service: TripService;

  constructor() {
    this.service = new TripService();
  }

  public startTrip = catchAsync(async (req: Request, res: Response) => {
    const trip = await this.service.startTrip(req.body);
    res.status(201).send(new ApiResponse(trip, 'Trip started successfully'));
  });

  public endTrip = catchAsync(async (req: Request, res: Response) => {
    const trip = await this.service.endTrip(req.params.id as string);
    res.send(new ApiResponse(trip, 'Trip ended successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const trips = await this.service.getAllTrips();
    res.send(new ApiResponse(trips));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const trip = await this.service.getTripById(req.params.id as string);
    res.send(new ApiResponse(trip));
  });
}
