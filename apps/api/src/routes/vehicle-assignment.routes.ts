import { Router } from 'express';
import { VehicleAssignmentController } from '../controllers/vehicle-assignment.controller';
import { validate } from '../middlewares/validate.middleware';
import { createVehicleAssignmentSchema, updateVehicleAssignmentSchema, getVehicleAssignmentSchema } from '../schemas/vehicle-assignment.schema';

const router = Router();
const controller = new VehicleAssignmentController();

router.post('/', validate(createVehicleAssignmentSchema), controller.create);
router.get('/', controller.getAll);
router.get('/active', controller.getByDriver);
router.get('/:id', validate(getVehicleAssignmentSchema), controller.getById);
router.patch('/:id', validate(updateVehicleAssignmentSchema), controller.update);
router.delete('/:id', validate(getVehicleAssignmentSchema), controller.delete);

export { router as vehicleAssignmentRoutes };
