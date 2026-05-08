import type { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class VehicleController {
  private service: VehicleService;

  constructor() {
    this.service = new VehicleService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const vehicle = await this.service.createVehicle(req.body);
    res.status(201).send(new ApiResponse(vehicle, 'Vehicle created successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const collegeId = req.query.collegeId as string;
    const vehicles = await this.service.getAllVehicles(collegeId);
    res.send(new ApiResponse(vehicles));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const vehicle = await this.service.getVehicleById(req.params.id as string);
    res.send(new ApiResponse(vehicle));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const vehicle = await this.service.updateVehicle(req.params.id as string, req.body);
    res.send(new ApiResponse(vehicle, 'Vehicle updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteVehicle(req.params.id as string);
    res.send(new ApiResponse(null, 'Vehicle deleted successfully'));
  });
}
