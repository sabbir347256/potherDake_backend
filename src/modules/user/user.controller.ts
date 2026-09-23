import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import { sendVerificationEmail } from "../utils/email.utils";
import appError from "../../errorsHelper/appError";
import { sendResponse, utils } from "../utils/utils";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../utils/queryBuilder";
import jwt from "jsonwebtoken";
import { authenticate } from "passport";
import { deleteOldCloudinaryImage } from "../../config/imagefunciton";
import { Role } from "./user.interface";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const userSearchableFields = [
  "fullName",
  "email",
  "contactNo",
  "userID",
  "nidNo",
];

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullName, contactNo, email, password, role } = req.body;

    if (!fullName || !contactNo || !email || !password || !role) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "fullName, contactNo, email, password, and role are required!",
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isExist = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactNo: contactNo.trim() }],
    });

    if (isExist && isExist.isVerified) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "Email or Contact Number is already registered and verified!",
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    let userRecord;

    const authProvider = [
      { provider: "credentials", providerID: normalizedEmail },
    ];

    if (isExist) {
      Object.assign(isExist, {
        fullName,
        contactNo,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        verificationCode: otpCode,
        verificationExpiry: expiryTime,
        isVerified: false,
        isApproved: false,
        isActive: "INACTIVE",
        auths: authProvider,
      });
      userRecord = isExist;
    } else {
      userRecord = new User({
        fullName,
        contactNo,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        verificationCode: otpCode,
        verificationExpiry: expiryTime,
        isVerified: false,
        isApproved: false,
        isActive: "INACTIVE",
        auths: authProvider,
      });
    }

    try {
      await sendVerificationEmail(userRecord.email, otpCode);
    } catch (emailError) {
      console.error("Email sending failed: ", emailError);
      throw new appError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to send verification email. Please try again.",
      );
    }

    await userRecord.save();

    const result = userRecord.toObject();
    delete (result as any).password;
    delete (result as any).verificationCode;

    return utils.sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        "Registration initial stage successful. Verification code sent to your email.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const completeRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otpCode, gender, profession, nidNo } = req.body;
    console.log(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!email || !otpCode || !gender || !profession || !nidNo) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "email, otpCode, gender, profession, and nidNo are required!",
      );
    }

    const nidFrontFile = files?.nidFront?.[0];
    const nidBackFile = files?.nidBack?.[0];

    if (!nidFrontFile || !nidBackFile) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "Both NID Front and NID Back images are required!",
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      throw new appError(StatusCodes.NOT_FOUND, "User not found!");
    }

    if (user.isVerified) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "User is already verified and registered!",
      );
    }

    if ((user as any).verificationCode !== otpCode) {
      throw new appError(StatusCodes.BAD_REQUEST, "Invalid verification code!");
    }

    if (
      (user as any).verificationExpiry &&
      new Date() > new Date((user as any).verificationExpiry)
    ) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "Verification code has expired!",
      );
    }

    const nidFrontPath =
      nidFrontFile.path || nidFrontFile.location || nidFrontFile.filename;
    const nidBackPath =
      nidBackFile.path || nidBackFile.location || nidBackFile.filename;

    user.gender = gender;
    user.profession = profession;
    user.nidNo = nidNo;
    user.nidFront = nidFrontPath;
    user.nidBack = nidBackPath;
    user.isVerified = true;
    user.isDocumentVerification = false;
    user.isApproved = true;
    user.isActive = "INACTIVE" as any;
    (user as any).verificationCode = null;
    (user as any).verificationExpiry = null;

    await user.save();

    const result = user.toObject();
    delete (result as any).password;
    delete (result as any).verificationCode;

    return utils.sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Account verification and registration completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPassengers = async (req: Request, res: Response) => {
  try {
    const passengerQuery = new QueryBuilder(
      User.find({ role: Role.PASSENGER, isDeleted: false }),
      req.query,
    )
      .search(userSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await passengerQuery.modelQuery;
    const meta = await passengerQuery.countTotal();

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Passengers retrieved successfully",
      meta,
      data,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to fetch passengers",
    });
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const passengerQuery = new QueryBuilder(
      User.find({
        isDeleted: false,
        role: { $in: [Role.PASSENGER, Role.DRIVER] },
      }),
      req.query,
    )
      .search(userSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await passengerQuery.modelQuery;
    const meta = await passengerQuery.countTotal();

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Passengers retrieved successfully",
      meta,
      data,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to fetch passengers",
    });
  }
};

const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const driverQuery = new QueryBuilder(
      User.find({ role: Role.DRIVER, isDeleted: false }),
      req.query,
    )
      .search(userSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await driverQuery.modelQuery;
    const meta = await driverQuery.countTotal();

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Drivers retrieved successfully",
      meta,
      data,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to fetch drivers",
    });
  }
};

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await User.findOne({
      $or: [{ userID: userId }, { _id: userId }],
    }).select("-password");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User profile not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.userId;
    const file = req.file as Express.Multer.File & { path?: string; location?: string; filename?: string };

    if (!file) {
      throw new appError(StatusCodes.BAD_REQUEST, "Image file is required!");
    }

    const imagePath = file.path || file.location || file.filename;

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imagePath },
      { new: true, runValidators: true },
    ).select("-password -verificationCode");

    if (!user) {
      throw new appError(StatusCodes.NOT_FOUND, "User not found!");
    }

    return utils.sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile image updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const rechargeWallet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.userId;
    const { amount } = req.body;

    const numAmount = Number(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      throw new appError(
        StatusCodes.BAD_REQUEST,
        "Please provide a valid positive amount!",
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new appError(StatusCodes.NOT_FOUND, "User not found!");
    }

    const currentBalance = user.mainWalletBalance || 0;
    user.mainWalletBalance = currentBalance + numAmount;

    await user.save();

    const result = user.toObject();
    delete (result as any).password;
    delete (result as any).verificationCode;

    return utils.sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Wallet recharged successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: status },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error,
    });
  }
};

export const userControllers = {
  registerUser,
  completeRegistration,
  getAllPassengers,
  getAllDrivers,
  getProfile,
  getAllUsers,
  updateProfileImage,
  rechargeWallet,
  updateUserStatus,
  deleteUser,
};
