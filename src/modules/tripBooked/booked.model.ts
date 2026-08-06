import { Schema, model } from 'mongoose';
import { IBooking } from './booked.interface';

export const BookingSchema: Schema<IBooking> = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true
    },
    passengerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

BookingSchema.index({ tripId: 1, passengerId: 1 });

export const Booking = model<IBooking>('Booking', BookingSchema);