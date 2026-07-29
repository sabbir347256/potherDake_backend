import mongoose, { Model, Schema } from "mongoose";
import { IsActive, IsAuthProvider, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IsAuthProvider>(
    {
        provider: { type: String, required: true },
        providerID: { type: String, required: true },
    },
    { versionKey: false, _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
    {
        userID: { type: String, unique: true },
        mainWalletBalance: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        walletPoints: { type: Number, default: 0 },
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        age: { type: Number },
        gender: { type: String, required: true },
        profession: { type: String, required: true },
        contactNo: { type: String, required: true, unique: true, trim: true },
        nidNo: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        profileImage: { type: String, default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
        isVerified: { type: Boolean, default: false },
        isDocumentVerification: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        role: { type: String, enum: Object.values(Role), default: Role.PASSENGER, required: true },
        isActive: { type: String, enum: Object.values(IsActive), default: IsActive.INACTIVE },
        auths: [authProviderSchema],
    },
    { timestamps: true, versionKey: false }
);



UserSchema.pre("save", async function () {
    const user = this as any;

    const UserModel = this.constructor as Model<IUser>;

    if (!user.userID) {
        const lastUser = await UserModel.findOne({}, {}, { sort: { createdAt: -1 } });

        let currentSequence = 0;

        if (lastUser && lastUser.userID) {
            const parts = lastUser.userID.split("-");
            if (parts.length === 2) {
                currentSequence = parseInt(parts[1] || "0", 10);
            }
        }

        const nextSequence = currentSequence + 1;
        const paddedSequence = String(nextSequence).padStart(5, "0");

        user.userID = `77-${paddedSequence}`;
    }

});



export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);