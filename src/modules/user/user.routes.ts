import { Router } from "express";
import { userControllers } from "./user.controller";
import { upload } from "../../config/multer";
import { Role } from "./user.interface";
import { checkAuth } from "../middleware/auth.middleware";

const router = Router();


router.post("/register", upload.single('image'), userControllers.registerUser);


export const userRoutes = router;   