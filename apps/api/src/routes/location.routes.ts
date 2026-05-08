import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { validate } from '../middlewares/validate.middleware';
import { updateLocationSchema, getLocationHistorySchema } from '../schemas/location.schema';

const router = Router();
const controller = new LocationController();

router.post('/update', validate(updateLocationSchema), controller.updateLocation);
router.get('/vehicles/:id', validate(getLocationHistorySchema), controller.getVehicleHistory);
router.get('/trips/:tripId', controller.getTripHistory);

export { router as locationRoutes };
