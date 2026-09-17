import { Router } from "express";
import { chatController } from "./chat.controller";

const router = Router();

router.post("/send", chatController.sendMessage);
router.get("/conversations/:userId", chatController.getConversations);
router.get("/messages/:senderId/:receiverId", chatController.getMessagesBetweenUsers);

export const ChatRoutes = router;