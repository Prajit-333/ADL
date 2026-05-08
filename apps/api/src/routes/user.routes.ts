import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, getUserSchema } from '../schemas/user.schema';

const router = Router();
const controller = new UserController();

router.post('/', validate(createUserSchema), controller.create);
router.get('/', controller.getAll);
router.get('/:id', validate(getUserSchema), controller.getById);
router.patch('/:id', validate(updateUserSchema), controller.update);
router.delete('/:id', validate(getUserSchema), controller.delete);

export { router as userRoutes };
