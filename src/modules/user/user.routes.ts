import { Router } from "express";
import { userControllers } from "./user.controller";
import { upload } from "../../config/multer";
import { Role } from "./user.interface";
import { checkAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", userControllers.registerUser);

router.post(
  "/complete-registration",
  upload.fields([
    { name: "nidFront", maxCount: 1 },
    { name: "nidBack", maxCount: 1 },
  ]),
  userControllers.completeRegistration,
);
router.get("/passengers", checkAuth(Role?.ADMIN), userControllers.getAllPassengers);
router.get("/drivers", checkAuth(Role?.ADMIN), userControllers.getAllDrivers);
router.get("/allusers", checkAuth(Role?.ADMIN), userControllers.getAllUsers);
router.get("/profile", checkAuth(Role.ADMIN, Role.DRIVER, Role.PASSENGER), userControllers.getProfile);
router.patch("/update-profile-image",checkAuth(Role.ADMIN, Role.DRIVER, Role.PASSENGER),upload.single("profileImage"),userControllers.updateProfileImage,);
router.post("/recharge-wallet", checkAuth(Role.ADMIN, Role.DRIVER, Role.PASSENGER), userControllers.rechargeWallet);
router.patch("/status/:userId", checkAuth(Role.ADMIN), userControllers.updateUserStatus);
router.delete("/:userId", checkAuth(Role.ADMIN), userControllers.deleteUser);

export const userRoutes = router;
