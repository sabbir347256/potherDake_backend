import { Router } from 'express';
import { tripBookedController } from './booked.controller';
import { checkAuth } from '../middleware/auth.middleware';
import { Role } from '../user/user.interface';

const router = Router();

router.post('/tripBooked',checkAuth(Role.PASSENGER), tripBookedController.createBooking);
router.patch('/status/:bookingId', tripBookedController.updateBookingStatus);
router.get('/my-bookings', tripBookedController.getMyBookings);

export const tripBookedRoute = router;