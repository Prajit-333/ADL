import type { Request, Response } from 'express';
import { CollegeService } from '../services/college.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class CollegeController {
  private service: CollegeService;

  constructor() {
    this.service = new CollegeService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const college = await this.service.createCollege(req.body);
    res.status(201).send(new ApiResponse(college, 'College created successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const colleges = await this.service.getAllColleges();
    res.send(new ApiResponse(colleges));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const college = await this.service.getCollegeById(req.params.id as string);
    res.send(new ApiResponse(college));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const college = await this.service.updateCollege(req.params.id as string, req.body);
    res.send(new ApiResponse(college, 'College updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteCollege(req.params.id as string);
    res.send(new ApiResponse(null, 'College deleted successfully'));
  });
}
