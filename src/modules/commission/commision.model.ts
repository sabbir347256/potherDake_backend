import { Schema, model } from "mongoose";
import { ICommission } from "./commission.interfaces";

const commissionSchema = new Schema<ICommission>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Commission = model<ICommission>("Commission", commissionSchema);