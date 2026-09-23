import { Types } from "mongoose";

export interface ICommission {
  bookingId: Types.ObjectId;
  driverId: Types.ObjectId;
  amount: number;
  isDeleted?: boolean;
}