import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const user = await this.service.createUser(req.body);
    res.status(201).send(new ApiResponse(user, 'User created successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const collegeId = req.query.collegeId as string;
    const users = await this.service.getAllUsers(collegeId);
    res.send(new ApiResponse(users));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const user = await this.service.getUserById(req.params.id as string);
    res.send(new ApiResponse(user));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const user = await this.service.updateUser(req.params.id as string, req.body);
    res.send(new ApiResponse(user, 'User updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteUser(req.params.id as string);
    res.send(new ApiResponse(null, 'User deleted successfully'));
  });
}
