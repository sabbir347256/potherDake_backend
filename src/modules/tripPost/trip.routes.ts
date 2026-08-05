import { Router } from 'express';
import { tripController } from './trip.controller';
import { checkAuth } from '../middleware/auth.middleware';
import { Role } from '../user/user.interface';

const router = Router();

router.post('/create',checkAuth(Role?.DRIVER), tripController.createTrip);
router.get('/', tripController.getTrips);

export const  tripRouter = router;