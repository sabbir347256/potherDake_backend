import { createServer } from "http";
// import { Server as SocketServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import envVars from "./config/envars";
import { seedSuperAdmin } from "./modules/utils/seedSuperAdmin";

dotenv.config();

const port = envVars.PORT || 5001;
const dbUrl = envVars.DB_URL;

const httpServer = createServer(app);

// const io = new SocketServer(httpServer, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// socketConfig(io);

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