import { Router } from "express";
import { tripController } from "./trip.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/create", checkAuth(Role?.DRIVER), tripController.createTrip);
router.get("/", checkAuth(Role?.DRIVER, Role?.ADMIN, Role?.PASSENGER), tripController.getTrips);
router.get("/my-trips", checkAuth(Role?.DRIVER), tripController.getMyTrips);
router.delete('/:id', checkAuth(Role?.DRIVER), tripController.deleteTrip);
router.get("/find-rides", tripController.findRides);
router.get("/getDetailsTrip/:id", tripController.getSingleTrip);

export const tripRouter = router;
