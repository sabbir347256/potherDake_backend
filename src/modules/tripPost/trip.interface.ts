import { Document, Types } from 'mongoose';

export type EVehicleType = 'Bike' | 'Car' | 'Microbus';
export type EBookingType = 'Instant' | 'Manual';
export type ETripStatus = 'PENDING' | 'ACCEPTED' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface ILocation {
  addressName: string;
  location?: IGeoPoint;
}

export interface ITripPreferences {
  ac?: boolean;
  music?: boolean;
  luggage?: boolean;
  pets?: boolean;
  smoking?: boolean;
  helmet?: boolean;
  womenOnly?: boolean;
  maxLuggageWeight?: number;
}

export interface ITrip extends Document {
  driverId: Types.ObjectId;
  startingPoint: ILocation;
  destination: ILocation;
  stopPoints?: string[];
  date: string;
  departureTime: string;
  estimatedArrivalTime?: string;
  vehicleType: EVehicleType;
  availableSeats: number;
  preferences: ITripPreferences;
  pricePerSeat: number;
  earningsPerSeat?: number;
  platformFee?: number;
  bookingType: EBookingType;
  description?: string;
  status: ETripStatus;
  createdAt: Date;
  updatedAt: Date;
}