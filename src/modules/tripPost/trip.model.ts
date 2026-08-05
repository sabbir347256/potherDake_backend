import { Schema, model } from 'mongoose';
import { ITrip } from './trip.interface';

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    addressName: { type: String, required: true },
    location: { type: geoPointSchema }
  },
  { _id: false }
);

const tripPreferencesSchema = new Schema(
  {
    ac: { type: Boolean, default: false },
    music: { type: Boolean, default: false },
    luggage: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
    helmet: { type: Boolean, default: false },
    womenOnly: { type: Boolean, default: false },
    maxLuggageWeight: { type: Number, default: 0 }
  },
  { _id: false }
);

const tripSchema = new Schema<ITrip>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startingPoint: {
      type: locationSchema,
      required: true
    },
    destination: {
      type: locationSchema,
      required: true
    },
    stopPoints: [{ type: String }],
    date: {
      type: String,
      required: true
    },
    departureTime: {
      type: String,
      required: true
    },
    estimatedArrivalTime: {
      type: String
    },
    vehicleType: {
      type: String,
      enum: ['Bike', 'Car', 'Microbus'],
      required: true
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    preferences: {
      type: tripPreferencesSchema,
      default: {}
    },
    pricePerSeat: {
      type: Number,
      required: true
    },
    earningsPerSeat: {
      type: Number
    },
    platformFee: {
      type: Number
    },
    bookingType: {
      type: String,
      enum: ['Instant', 'Manual'],
      default: 'Instant'
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'ON_GOING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

tripSchema.index({ 'startingPoint.location': '2dsphere' });
tripSchema.index({ 'destination.location': '2dsphere' });

export const Trip = model<ITrip>('Trip', tripSchema);