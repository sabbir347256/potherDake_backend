import { Request, Response } from "express";
import { Trip } from "./trip.model";
import { utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";

const createTrip = async (req: Request, res: Response) => {
    try {
        console.log(req.body)
        console.log(req.user)
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
            description
        } = req.body;

        const parsedPrice = Number(pricePerSeat);
        const platformFee = parsedPrice * 0.1;
        const earningsPerSeat = parsedPrice - platformFee;

        const newTrip = await Trip.create({
            driverId,
            startingPoint,
            destination,
            stopPoints: Array.isArray(stopPoints) ? stopPoints : stopPoints ? stopPoints.split(',').map((s: string) => s.trim()) : [],
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
            description
        });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Trip posted successfully',
            data: newTrip
        })

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

const getTrips = async (req: Request, res: Response): Promise<Response> => {
    try {
        const trips = await Trip.find().populate('driverId', 'name email avatar phone');
        return res.status(200).json({
            success: true,
            data: trips
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

export const tripController = {
    createTrip,
    getTrips
}