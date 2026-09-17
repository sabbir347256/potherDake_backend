import { Request, Response } from "express";
import mongoose from "mongoose";
import { Message } from "./chat.model";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: "senderId, receiverId and message are required",
      });
    }

    const newMessage = await Message.create({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending message",
    });
  }
};

const getConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userObjectId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$message" },
          time: { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userObjectId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 1,
          name: "$userDetails.fullName",
          avatar: "$userDetails.profileImage",
          lastMessage: 1,
          time: 1,
          unread: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching conversations" });
  }
};

const getMessagesBetweenUsers = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.params;

    await Message.updateMany(
      { senderId: receiverId, receiverId: senderId, isRead: false },
      { $set: { isRead: true } },
    );

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching messages" });
  }
};

export const chatController = {
  getConversations,
  getMessagesBetweenUsers,
  sendMessage,
};
