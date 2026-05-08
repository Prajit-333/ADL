import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';
import { RouteStopController } from '../controllers/route-stop.controller';
import { validate } from '../middlewares/validate.middleware';
import { createRouteSchema, updateRouteSchema, getRouteSchema } from '../schemas/route.schema';
import { createRouteStopSchema, updateRouteStopSchema, getRouteStopSchema } from '../schemas/route-stop.schema';

const router = Router();
const routeController = new RouteController();
const stopController = new RouteStopController();

// Route endpoints
router.post('/', validate(createRouteSchema), routeController.create);
router.get('/', routeController.getAll);
router.get('/:id', validate(getRouteSchema), routeController.getById);
router.patch('/:id', validate(updateRouteSchema), routeController.update);
router.delete('/:id', validate(getRouteSchema), routeController.delete);

// Route Stop endpoints
router.post('/:routeId/stops', validate(createRouteStopSchema), stopController.addStop);
router.get('/:routeId/stops', stopController.getStopsByRoute);

// Generic stop endpoints (patch/delete)
router.patch('/stops/:id', validate(updateRouteStopSchema), stopController.update);
router.delete('/stops/:id', validate(getRouteStopSchema), stopController.delete);

export { router as routeRoutes };
