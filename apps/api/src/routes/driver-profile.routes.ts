import { Router } from 'express';
import { DriverProfileController } from '../controllers/driver-profile.controller';
import { validate } from '../middlewares/validate.middleware';
import { createDriverProfileSchema, updateDriverProfileSchema, getDriverProfileSchema } from '../schemas/driver-profile.schema';

const router = Router();
const controller = new DriverProfileController();

router.post('/', validate(createDriverProfileSchema), controller.create);
router.get('/', controller.getAll);
router.get('/:id', validate(getDriverProfileSchema), controller.getById);
router.patch('/:id', validate(updateDriverProfileSchema), controller.update);
router.delete('/:id', validate(getDriverProfileSchema), controller.delete);

export { router as driverProfileRoutes };
