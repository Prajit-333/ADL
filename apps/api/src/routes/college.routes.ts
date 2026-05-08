import { Router } from 'express';
import { CollegeController } from '../controllers/college.controller';
import { validate } from '../middlewares/validate.middleware';
import { createCollegeSchema, updateCollegeSchema, getCollegeSchema, deleteCollegeSchema } from '../schemas/college.schema';

const router = Router();
const controller = new CollegeController();

router.post('/', validate(createCollegeSchema), controller.create);
router.get('/', controller.getAll);
router.get('/:id', validate(getCollegeSchema), controller.getById);
router.patch('/:id', validate(updateCollegeSchema), controller.update);
router.delete('/:id', validate(deleteCollegeSchema), controller.delete);

export { router as collegeRoutes };
