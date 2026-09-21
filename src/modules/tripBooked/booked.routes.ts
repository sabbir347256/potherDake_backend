import { Router } from 'express';
import { tripBookedController } from './booked.controller';
import { checkAuth } from '../middleware/auth.middleware';
import { Role } from '../user/user.interface';

const router = Router();

router.post('/tripBooked',checkAuth(Role.PASSENGER), tripBookedController.createBooking);
// router.patch('/status/:bookingId', tripBookedController.updateBookingStatus);
router.patch('/status/:bookingId', checkAuth(Role.DRIVER, Role.ADMIN), tripBookedController.updateBookingStatus);
router.get('/my-bookings',checkAuth(Role.PASSENGER), tripBookedController.getMyBookings);
router.get('/driver-bookings', checkAuth(Role.DRIVER), tripBookedController.getDriverBookings);
router.get("/", checkAuth(Role?.ADMIN, Role?.PASSENGER, Role?.DRIVER), tripBookedController.getAllBookings);
router.get("/:id", checkAuth(Role?.ADMIN, Role?.PASSENGER, Role?.DRIVER), tripBookedController.getSingleBooking);

export const tripBookedRoute = router;