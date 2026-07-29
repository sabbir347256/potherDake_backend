import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    DRIVER = "DRIVER",
    PASSENGER = "PASSENGER",
}

export type IsAuthProvider = {
    provider: "google" | "credentials";
    providerID: string;
};

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED",
}

export type IProfileUnlock = {
    unlockedBy: Types.ObjectId;
    targetProfile: Types.ObjectId; 
    createdAt: Date;
}

export type IUser = {
    _id: Types.ObjectId;
    userID: string;
    mainWalletBalance: number;
    totalAmount : number;
    walletPoints: number;
    fullName: string;
    birth: string;
    age: number;
    gender: string;
    profession: string;
    email: string;
    contactNo: string;
    nidNo: string;
    password: string;
    profileImage?: string;
    isVerified: boolean;
    isDocumentVerification: boolean;
    isDeleted: boolean;
    isApproved: boolean;
    role: Role;
    isActive?: IsActive;
    auths: IsAuthProvider[];
}