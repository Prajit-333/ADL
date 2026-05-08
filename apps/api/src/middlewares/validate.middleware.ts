import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: z.ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((details) => `${details.path.join('.')}: ${details.message}`).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    return next(error);
  }
};
