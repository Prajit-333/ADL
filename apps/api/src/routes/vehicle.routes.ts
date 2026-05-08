import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { validate } from '../middlewares/validate.middleware';
import { createVehicleSchema, updateVehicleSchema, getVehicleSchema } from '../schemas/vehicle.schema';

const router = Router();
const controller = new VehicleController();

router.post('/', validate(createVehicleSchema), controller.create);
router.get('/', controller.getAll);
router.get('/:id', validate(getVehicleSchema), controller.getById);
router.patch('/:id', validate(updateVehicleSchema), controller.update);
router.delete('/:id', validate(getVehicleSchema), controller.delete);

export { router as vehicleRoutes };
