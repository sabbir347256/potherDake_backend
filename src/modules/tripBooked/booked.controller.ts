import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { Booking } from "./booked.model";
import { Trip } from "../tripPost/trip.model";
import { sendResponse } from "../utils/utils";
import QueryBuilder from "../utils/queryBuilder";

const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = (req as any).user?._id || req.body.passengerId;
    const { tripId, seatsBooked,driverId } = req.body;

    const requestedSeats = Number(seatsBooked);

    if (!tripId || !requestedSeats || requestedSeats < 1) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid input data",
        data: null,
      });
      return;
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Trip not found",
        data: null,
      });
      return;
    }

    if (trip.status !== "PENDING") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Trip is not available for booking",
        data: null,
      });
      return;
    }

    if (trip.driverId.toString() === passengerId.toString()) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Driver cannot book their own trip",
        data: null,
      });
      return;
    }

    if (trip.availableSeats < requestedSeats) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Not enough seats available",
        data: null,
      });
      return;
    }

    const initialStatus =
      trip.bookingType === "Instant" ? "CONFIRMED" : "PENDING";
    const totalPrice = trip.pricePerSeat * requestedSeats;

    const booking = await Booking.create({
      tripId,
      passengerId,
      driverId,
      seatsBooked: requestedSeats,
      totalPrice,
      status: initialStatus,
    });

    if (initialStatus === "CONFIRMED") {
      trip.availableSeats -= requestedSeats;
      await trip.save();
    }

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message:
        initialStatus === "CONFIRMED"
          ? "Trip booked successfully"
          : "Booking request sent for approval",
      data: booking,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Internal Server Error",
      data: null,
    });
  }
};

// const updateBookingStatus = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { bookingId } = req.params;
//     const { status } = req.body;
//     const driverId = (req as any).user?._id || req.body.driverId;

//     if (!["CONFIRMED", "CANCELLED"].includes(status)) {
//       await session.abortTransaction();
//       session.endSession();
//       sendResponse(res, {
//         statusCode: StatusCodes.BAD_REQUEST,
//         success: false,
//         message: "Invalid status update",
//         data: null,
//       });
//       return;
//     }

//     const booking = await Booking.findById(bookingId).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       session.endSession();
//       sendResponse(res, {
//         statusCode: StatusCodes.NOT_FOUND,
//         success: false,
//         message: "Booking not found",
//         data: null,
//       });
//       return;
//     }

//     const trip = await Trip.findById(booking.tripId).session(session);

//     if (!trip) {
//       await session.abortTransaction();
//       session.endSession();
//       sendResponse(res, {
//         statusCode: StatusCodes.NOT_FOUND,
//         success: false,
//         message: "Associated trip not found",
//         data: null,
//       });
//       return;
//     }

//     if (trip.driverId.toString() !== driverId.toString()) {
//       await session.abortTransaction();
//       session.endSession();
//       sendResponse(res, {
//         statusCode: StatusCodes.FORBIDDEN,
//         success: false,
//         message: "Unauthorized access",
//         data: null,
//       });
//       return;
//     }

//     if (booking.status !== "PENDING") {
//       await session.abortTransaction();
//       session.endSession();
//       sendResponse(res, {
//         statusCode: StatusCodes.BAD_REQUEST,
//         success: false,
//         message: `Booking is already ${booking.status.toLowerCase()}`,
//         data: null,
//       });
//       return;
//     }

//     if (status === "CONFIRMED") {
//       if (trip.availableSeats < booking.seatsBooked) {
//         await session.abortTransaction();
//         session.endSession();
//         sendResponse(res, {
//           statusCode: StatusCodes.BAD_REQUEST,
//           success: false,
//           message: "Not enough seats available to confirm this booking",
//           data: null,
//         });
//         return;
//       }
//       trip.availableSeats -= booking.seatsBooked;
//       await trip.save({ session });
//     }

//     booking.status = status;
//     await booking.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     sendResponse(res, {
//       statusCode: StatusCodes.OK,
//       success: true,
//       message: `Booking ${status.toLowerCase()} successfully`,
//       data: booking,
//     });
//   } catch (error: any) {
//     await session.abortTransaction();
//     session.endSession();
//     sendResponse(res, {
//       statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
//       success: false,
//       message: error.message || "Internal Server Error",
//       data: null,
//     });
//   }
// };


const getDriverBookings = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.userId;

    const bookings = await Booking.find({
      driverId: new Types.ObjectId(driverId)
    })
      .populate('tripId')
      .populate('passengerId')
      .populate('driverId');

    return res.status(200).json({
      success: true,
      message: 'Driver bookings fetched successfully',
      data: bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver bookings',
      error
    });
  }
};

const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId} = req.params;
    const { status } = req.body;


    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error
    });
  }
};

const getMyBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = (req as any).user?.userId || req.query.userId;

    const bookings = await Booking.find({ passengerId })
      .populate({
        path: "tripId",
        populate: {
          path: "driverId",
          select: "fullName email contactNo profileImage",
        },
      })
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
      meta: {
        total: bookings.length,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Internal Server Error",
      data: null,
    });
  }
};

const bookingSearchableFields = ["status"];

const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookingQuery = new QueryBuilder(
      Booking.find().populate("tripId").populate({
        path: "passengerId",
        select: "-password -verificationCode -verificationExpiry",
      }),
      req.query,
    )
      .search(bookingSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await bookingQuery.modelQuery;
    const meta = await bookingQuery.countTotal();

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Bookings retrieved successfully",
      meta,
      data,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
};

const getSingleBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Booking.findById(id).populate("tripId").populate({
      path: "passengerId",
      select: "-password -verificationCode -verificationExpiry",
    });

    if (!result) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Booking not found",
        data: null,
      });
    }

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Booking retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to fetch booking",
    });
  }
};

export const tripBookedController = {
  createBooking,
  updateBookingStatus,
  getMyBookings,
  getAllBookings,
  getSingleBooking,
  getDriverBookings,
  // updateBookingStatusNew
};
