import type { Request, Response } from 'express';
import { BusService } from '../services/bus.service';

export class BusController {
  constructor(private busService: BusService) {}

  public createBus = async (req: Request, res: Response) => {
    try {
      const { registration, capacity, type, status } = req.body;

      if (!registration || !capacity) {
        return res.status(400).json({ success: false, error: 'Missing required fields: registration, capacity' });
      }

      const bus = await this.busService.createBus({
        registration,
        capacity: Number(capacity),
        type,
        status,
      });

      res.status(201).json({ success: true, data: bus });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public deleteBus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.busService.deleteBus(id as string);
      res.status(200).json({ success: true, message: 'Bus deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getBuses = async (req: Request, res: Response) => {
    try {
      const buses = await this.busService.getAllBuses();
      res.status(200).json({ success: true, data: buses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getActive = async (req: Request, res: Response) => {
    try {
      const activeBuses = await this.busService.getActiveBuses();
      res.status(200).json({ success: true, data: activeBuses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
