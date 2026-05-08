import type { Request, Response } from 'express';
import { RouteStopService } from '../services/route-stop.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class RouteStopController {
  private service: RouteStopService;

  constructor() {
    this.service = new RouteStopService();
  }

  public addStop = catchAsync(async (req: Request, res: Response) => {
    const stop = await this.service.addStop({
      ...req.body,
      routeId: req.params.routeId as string
    });
    res.status(201).send(new ApiResponse(stop, 'Route stop added successfully'));
  });

  public getStopsByRoute = catchAsync(async (req: Request, res: Response) => {
    const stops = await this.service.getStopsByRoute(req.params.routeId as string);
    res.send(new ApiResponse(stops));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const stop = await this.service.updateStop(req.params.id as string, req.body);
    res.send(new ApiResponse(stop, 'Route stop updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteStop(req.params.id as string);
    res.send(new ApiResponse(null, 'Route stop deleted successfully'));
  });
}
