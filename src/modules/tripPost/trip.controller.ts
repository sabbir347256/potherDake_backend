import { Request, Response } from "express";
import { Trip } from "./trip.model";
import { sendResponse, utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../utils/queryBuilder";
import { Types } from "mongoose";
import { Booking } from "../tripBooked/booked.model";

const createTrip = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    console.log(req.user);
    const driverId = (req as any).user?.userId;

    const {
      startingPoint,
      destination,
      stopPoints,
      date,
      departureTime,
      estimatedArrivalTime,
      vehicleType,
      availableSeats,
      preferences,
      pricePerSeat,
      bookingType,
      description,
    } = req.body;

    const parsedPrice = Number(pricePerSeat);
    const platformFee = parsedPrice * 0.1;
    const earningsPerSeat = parsedPrice - platformFee;

    const newTrip = await Trip.create({
      driverId,
      startingPoint,
      destination,
      stopPoints: Array.isArray(stopPoints)
        ? stopPoints
        : stopPoints
          ? stopPoints.split(",").map((s: string) => s.trim())
          : [],
      date,
      departureTime,
      estimatedArrivalTime,
      vehicleType,
      availableSeats,
      preferences,
      pricePerSeat: parsedPrice,
      platformFee,
      earningsPerSeat,
      bookingType,
      description,
    });

    return utils.sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Trip posted successfully",
      data: newTrip,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getMyTrips = async (req: Request, res: Response) => {
  const driverId = (req.user as { userId: Types.ObjectId | string })?.userId;

  const tripQuery = new QueryBuilder(Trip.find({ driverId }), req.query)
    .search([
      "startingPoint.addressName",
      "destination.addressName",
      "description",
    ])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await tripQuery.modelQuery;
  const meta = await tripQuery.countTotal();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Driver trips retrieved successfully",
    meta,
    data,
  });
};

const getTrips = async (req: Request, res: Response): Promise<Response> => {
  try {
    const trips = await Trip.find().populate(
      "driverId",
      "name email avatar phone",
    );
    return res.status(200).json({
      success: true,
      data: trips,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = (req.user as { userId: Types.ObjectId | string })?.userId;

  if (!driverId) {
    sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "Unauthorized access",
      data: null,
    });
    return;
  }

  const trip = await Trip.findOneAndDelete({
    _id: new Types.ObjectId(id as string),
    driverId: new Types.ObjectId(driverId as string),
  });

  if (!trip) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: "Trip not found or you are not authorized to delete it",
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Trip deleted successfully",
    data: trip,
  });
};

const findRides = async (req: Request, res: Response) => {
  try {
    const {
      fromLat,
      fromLng,
      toLat,
      toLng,
      maxDistance = 100,
      minPrice,
      maxPrice,
      minRating,
      date,
      vehicleType,
      ...otherQueries
    } = req.query;

    const confirmedBookings = await Booking.find({ status: "CONFIRMED" }).select(
      "tripId",
    );
    const confirmedTripIds = confirmedBookings.map((booking) => booking.tripId);

    let query = Trip.find({
      _id: { $nin: confirmedTripIds },
      availableSeats: { $gt: 0 },
    });

    const EARTH_RADIUS_IN_KM = 6378.1;
    const maxDistanceInKm = Number(maxDistance);

    if (fromLat && fromLng) {
      query = query.find({
        "startingPoint.location": {
          $geoWithin: {
            $centerSphere: [
              [Number(fromLng), Number(fromLat)],
              maxDistanceInKm / EARTH_RADIUS_IN_KM,
            ],
          },
        },
      });
    }

    if (toLat && toLng) {
      query = query.find({
        "destination.location": {
          $geoWithin: {
            $centerSphere: [
              [Number(toLng), Number(toLat)],
              maxDistanceInKm / EARTH_RADIUS_IN_KM,
            ],
          },
        },
      });
    }

    if (date) {
      query = query.find({ date: String(date) });
    }

    if (vehicleType) {
      query = query.find({ vehicleType: String(vehicleType) });
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      query = query.find({ pricePerSeat: priceFilter });
    }

    if (minRating) {
      query = query.populate({
        path: "driverId",
        match: { rating: { $gte: Number(minRating) } },
      });
    } else {
      query = query.populate("driverId");
    }

    const tripQuery = new QueryBuilder(query, otherQueries)
      .search([
        "startingPoint.addressName",
        "destination.addressName",
        "stopPoints",
        "description",
      ])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await tripQuery.modelQuery;
    const meta = await tripQuery.countTotal();

    const filteredResult = minRating
      ? result.filter((trip: any) => trip.driverId !== null)
      : result;

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      success: true,
      message: "Rides retrieved successfully",
      meta,
      data: filteredResult,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Failed to retrieve rides",
      data: null,
    });
  }
};

const getSingleTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id).populate("driverId");

    if (!trip) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Trip not found",
        data: null,
      });
    }

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Trip details retrieved successfully",
      data: trip,
    });
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Failed to retrieve trip details",
      data: null,
    });
  }
};

export const tripController = {
  createTrip,
  getTrips,
  getMyTrips,
  deleteTrip,
  findRides,
  getSingleTrip,
};
