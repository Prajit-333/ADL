import type { Request, Response } from 'express';
import { DriverProfileService } from '../services/driver-profile.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class DriverProfileController {
  private service: DriverProfileService;

  constructor() {
    this.service = new DriverProfileService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const profile = await this.service.createProfile(req.body);
    res.status(201).send(new ApiResponse(profile, 'Driver profile created successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const profiles = await this.service.getAllProfiles();
    res.send(new ApiResponse(profiles));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const profile = await this.service.getProfileById(req.params.id as string);
    res.send(new ApiResponse(profile));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const profile = await this.service.updateProfile(req.params.id as string, req.body);
    res.send(new ApiResponse(profile, 'Driver profile updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteProfile(req.params.id as string);
    res.send(new ApiResponse(null, 'Driver profile deleted successfully'));
  });
}
