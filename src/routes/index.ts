import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { AuthRouter } from "../modules/auth/auth.routes";
import { tripRouter } from "../modules/tripPost/trip.routes";
import { tripBookedRoute } from "../modules/tripBooked/booked.routes";


export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    router: userRoutes,
  },
  {
    path: "/auth",
    router: AuthRouter,
  },
  {
    path: "/tripRoute",
    router: tripRouter,
  },
  {
    path: "/tripBookedRoute",
    router: tripBookedRoute,
  },

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.router);
});
