import { io } from "socket.io-client";
import envVars from "../../config/envars";

export const socket = io(envVars?.backendUrl || "http://localhost:5000", {
  autoConnect: false,
});