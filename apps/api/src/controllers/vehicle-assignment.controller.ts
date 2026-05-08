import type { Request, Response } from 'express';
import { VehicleAssignmentService } from '../services/vehicle-assignment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export class VehicleAssignmentController {
  private service: VehicleAssignmentService;

  constructor() {
    this.service = new VehicleAssignmentService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const assignment = await this.service.createAssignment(req.body);
    res.status(201).send(new ApiResponse(assignment, 'Vehicle assigned successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const assignments = await this.service.getAllAssignments();
    res.send(new ApiResponse(assignments));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const assignment = await this.service.getAssignmentById(req.params.id as string);
    res.send(new ApiResponse(assignment));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const assignment = await this.service.updateAssignment(req.params.id as string, req.body);
    res.send(new ApiResponse(assignment, 'Assignment updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteAssignment(req.params.id as string);
    res.send(new ApiResponse(null, 'Assignment deleted successfully'));
  });

  public getByDriver = catchAsync(async (req: Request, res: Response) => {
    const driverId = req.query.driverId as string;
    if (!driverId) throw new ApiError(400, 'driverId is required');
    const assignment = await this.service.getAssignmentByDriverId(driverId);
    res.send(new ApiResponse(assignment));
  });
}
