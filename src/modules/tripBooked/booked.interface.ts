import { Document, Types } from 'mongoose';

export type EBookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface IBooking extends Document {
  tripId: Types.ObjectId;
  passengerId: Types.ObjectId;
  seatsBooked: number;
  totalPrice: number;
  status: EBookingStatus;
  createdAt: Date;
  updatedAt: Date;
}