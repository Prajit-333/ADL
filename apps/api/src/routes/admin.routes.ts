import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const controller = new AdminController();

// Driver management
router.post('/drivers', controller.createDriver);
router.get('/drivers', controller.getDrivers);
router.delete('/drivers/:id', controller.deleteDriver);

// Route & Stop management
router.post('/routes', controller.createRoute);
router.delete('/routes/:id', controller.deleteRoute);
router.post('/stops', controller.createStop);
router.delete('/stops/:id', controller.deleteStop);

// Vehicle Assignment management
router.post('/assignments', controller.createAssignment);
router.get('/assignments', controller.getAssignments);
router.patch('/assignments/:id/end', controller.endAssignment);
router.delete('/assignments/:id', controller.deleteAssignment);

export { router as adminRoutes };
