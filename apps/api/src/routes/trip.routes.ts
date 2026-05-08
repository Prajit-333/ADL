import { Router } from 'express';
import { TripController } from '../controllers/trip.controller';
import { validate } from '../middlewares/validate.middleware';
import { startTripSchema, endTripSchema, getTripSchema } from '../schemas/trip.schema';

const router = Router();
const controller = new TripController();

router.post('/start', validate(startTripSchema), controller.startTrip);
router.patch('/:id/end', validate(endTripSchema), controller.endTrip);
router.get('/', controller.getAll);
router.get('/:id', validate(getTripSchema), controller.getById);

export { router as tripRoutes };
