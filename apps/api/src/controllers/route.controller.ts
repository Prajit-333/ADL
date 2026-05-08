import type { Request, Response } from 'express';
import { RouteService } from '../services/route.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export class RouteController {
  private service: RouteService;

  constructor() {
    this.service = new RouteService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const route = await this.service.createRoute(req.body);
    res.status(201).send(new ApiResponse(route, 'Route created successfully'));
  });

  public getAll = catchAsync(async (req: Request, res: Response) => {
    const routes = await this.service.getAllRoutes();
    res.send(new ApiResponse(routes));
  });

  public getById = catchAsync(async (req: Request, res: Response) => {
    const route = await this.service.getRouteById(req.params.id as string);
    res.send(new ApiResponse(route));
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const route = await this.service.updateRoute(req.params.id as string, req.body);
    res.send(new ApiResponse(route, 'Route updated successfully'));
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteRoute(req.params.id as string);
    res.send(new ApiResponse(null, 'Route deleted successfully'));
  });
}
