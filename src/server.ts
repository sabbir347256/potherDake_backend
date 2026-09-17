import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import envVars from "./config/envars";
import { seedSuperAdmin } from "./modules/utils/seedSuperAdmin";
import { Message } from "./modules/chat/chat.model";

dotenv.config();

const port = envVars.PORT || 5001;
const dbUrl = envVars.DB_URL;

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
  socket.on("join", (userId: string) => {
    onlineUsers.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async (data: { senderId: string; receiverId: string; message: string }) => {
    try {
      const { senderId, receiverId, message } = data;

      const newMessage = await Message.create({
        senderId,
        receiverId,
        message,
      });

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", newMessage);
      }

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSent", newMessage);
      }
    } catch (error) {
      console.error("Socket error on sendMessage:", error);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(dbUrl as string);
    console.log("Database connected successfully");

    await seedSuperAdmin();

    httpServer.listen(Number(port), "0.0.0.0", () => {
      console.log(`Server running on ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();