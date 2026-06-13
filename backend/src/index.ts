import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./config/database";
import { setupChatSocket } from "./socket/chat";
import {
  broadcastBestAnswerSelected,
  broadcastNewAnswer,
  broadcastNewQuestion,
  broadcastRewardReceived,
  isValidRoomId,
  setIoInstance,
} from "./services/notification";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setIoInstance(io);
setupChatSocket(io);

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.get("/api/chat/rooms", (_req, res) => {
  res.json({
    success: true,
    data: {
      rooms: [
        { id: "general", label: "General", description: "Chat komunitas umum" },
        { id: "question:{postId}", label: "Per Pertanyaan", description: "Room per post Q&A" },
        { id: "angkatan:{year}", label: "Per Angkatan", description: "Room per angkatan mahasiswa" },
      ],
    },
  });
});

app.get("/api/chat/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  if (!isValidRoomId(roomId)) {
    res.status(400).json({ success: false, error: "Invalid room ID" });
    return;
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { id: true, name: true } } },
    });

    res.json({
      success: true,
      data: messages
        .reverse()
        .map((m) => ({
          id: m.id,
          body: m.body,
          roomId: m.roomId,
          authorId: m.authorId,
          authorName: m.author.name,
          createdAt: m.createdAt.toISOString(),
        })),
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

app.post("/api/internal/broadcast/question", (req, res) => {
  const { postId, title, authorId, authorName } = req.body;
  if (!postId || !title || !authorId || !authorName) {
    res.status(400).json({ success: false, error: "Missing required fields" });
    return;
  }
  broadcastNewQuestion({ postId, title, authorId, authorName });
  res.json({ success: true });
});

app.post("/api/internal/broadcast/answer", (req, res) => {
  const { postId, answerId, authorId, authorName } = req.body;
  if (!postId || !answerId || !authorId || !authorName) {
    res.status(400).json({ success: false, error: "Missing required fields" });
    return;
  }
  broadcastNewAnswer({ postId, answerId, authorId, authorName });
  res.json({ success: true });
});

app.post("/api/internal/broadcast/reward", (req, res) => {
  const { userId, walletAddress, action, amount, txHash } = req.body;
  if (!userId || !walletAddress || !action || amount == null) {
    res.status(400).json({ success: false, error: "Missing required fields" });
    return;
  }
  broadcastRewardReceived({ userId, walletAddress, action, amount, txHash });
  res.json({ success: true });
});

app.post("/api/internal/broadcast/best-answer", (req, res) => {
  const { postId, answerId, authorId, authorName } = req.body;
  if (!postId || !answerId || !authorId || !authorName) {
    res.status(400).json({ success: false, error: "Missing required fields" });
    return;
  }
  broadcastBestAnswerSelected({ postId, answerId, authorId, authorName });
  res.json({ success: true });
});

const PORT = parseInt(process.env.PORT ?? "4000", 10);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Socket.io ready (CORS: ${corsOrigin})`);
});

export { app, io };
