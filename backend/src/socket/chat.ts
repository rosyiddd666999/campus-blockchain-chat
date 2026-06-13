import type { Server, Socket } from "socket.io";
import { jwtVerify } from "jose";
import { prisma } from "../config/database";
import { isValidRoomId } from "../services/notification";

const MESSAGE_COOLDOWN_MS = 3000;
const TYPING_TIMEOUT_MS = 3000;

interface SocketUser {
  userId: string;
  name: string;
  angkatan?: number;
}

interface JwtPayload {
  sub: string;
  name?: string;
  angkatan?: number;
}

const lastMessageAt = new Map<string, number>();
const roomUsers = new Map<string, Map<string, SocketUser>>();
const typingTimers = new Map<string, NodeJS.Timeout>();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function authenticateSocket(socket: Socket): Promise<SocketUser | null> {
  const token = socket.handshake.auth?.token as string | undefined;
  const devUserId = socket.handshake.auth?.userId as string | undefined;
  const devName = socket.handshake.auth?.name as string | undefined;
  const devAngkatan = socket.handshake.auth?.angkatan as number | undefined;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const jwtPayload = payload as JwtPayload;
      if (!jwtPayload.sub) return null;

      const user = await prisma.user.findUnique({
        where: { id: jwtPayload.sub },
        select: { id: true, name: true, angkatan: true },
      });

      if (user) {
        return { userId: user.id, name: user.name, angkatan: user.angkatan };
      }

      return {
        userId: jwtPayload.sub,
        name: jwtPayload.name ?? "User",
        angkatan: jwtPayload.angkatan,
      };
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === "development" && devUserId && devName) {
    let user = await prisma.user.findUnique({ where: { id: devUserId } });
    if (!user) {
      const slug = devUserId.replace(/\W/g, "").slice(0, 20);
      user = await prisma.user.create({
        data: {
          id: devUserId,
          walletAddress: `0x${slug.padEnd(40, "0").slice(0, 40)}`,
          nim: `DEV${slug.slice(0, 10)}`,
          name: devName,
          angkatan: devAngkatan ?? 2022,
        },
      });
    }
    return { userId: user.id, name: user.name, angkatan: user.angkatan };
  }

  return null;
}

function emitRoomUsers(io: Server, roomId: string): void {
  const users = roomUsers.get(roomId);
  const list = users ? Array.from(users.values()) : [];
  io.to(roomId).emit("room_users", { roomId, users: list });
}

function addUserToRoom(roomId: string, socketId: string, user: SocketUser): void {
  if (!roomUsers.has(roomId)) {
    roomUsers.set(roomId, new Map());
  }
  roomUsers.get(roomId)!.set(socketId, user);
}

function removeUserFromAllRooms(socketId: string): string[] {
  const affectedRooms: string[] = [];
  for (const [roomId, users] of roomUsers.entries()) {
    if (users.has(socketId)) {
      users.delete(socketId);
      affectedRooms.push(roomId);
      if (users.size === 0) {
        roomUsers.delete(roomId);
      }
    }
  }
  return affectedRooms;
}

function canSendMessage(userId: string): boolean {
  const now = Date.now();
  const last = lastMessageAt.get(userId) ?? 0;
  if (now - last < MESSAGE_COOLDOWN_MS) {
    return false;
  }
  lastMessageAt.set(userId, now);
  return true;
}

export function setupChatSocket(io: Server): void {
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }
      socket.data.user = user;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser;
    socket.join(`user:${user.userId}`);

    if (user.angkatan) {
      socket.join(`angkatan:${user.angkatan}`);
    }

    socket.emit("connected", { userId: user.userId, name: user.name });

    socket.on("join_room", async (payload: { roomId: string }, callback?) => {
      const roomId = payload?.roomId;
      if (!roomId || !isValidRoomId(roomId)) {
        callback?.({ success: false, error: "Invalid room ID" });
        return;
      }

      const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      for (const oldRoom of joinedRooms) {
        if (
          oldRoom.startsWith("question:") ||
          oldRoom.startsWith("angkatan:") ||
          oldRoom === "general"
        ) {
          socket.leave(oldRoom);
          const users = roomUsers.get(oldRoom);
          users?.delete(socket.id);
          if (users && users.size === 0) {
            roomUsers.delete(oldRoom);
          }
          emitRoomUsers(io, oldRoom);
        }
      }

      await socket.join(roomId);
      addUserToRoom(roomId, socket.id, user);
      emitRoomUsers(io, roomId);

      try {
        const messages = await prisma.chatMessage.findMany({
          where: { roomId },
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { author: { select: { id: true, name: true } } },
        });

        socket.emit("message_history", {
          roomId,
          messages: messages.map((m) => ({
            id: m.id,
            body: m.body,
            roomId: m.roomId,
            authorId: m.authorId,
            authorName: m.author.name,
            createdAt: m.createdAt.toISOString(),
          })),
        });

        callback?.({ success: true, data: { roomId } });
      } catch {
        callback?.({ success: false, error: "Failed to load messages" });
      }
    });

    socket.on("leave_room", (payload: { roomId: string }, callback?) => {
      const roomId = payload?.roomId;
      if (!roomId) {
        callback?.({ success: false, error: "Room ID required" });
        return;
      }

      socket.leave(roomId);
      const users = roomUsers.get(roomId);
      users?.delete(socket.id);
      if (users && users.size === 0) {
        roomUsers.delete(roomId);
      }
      emitRoomUsers(io, roomId);
      callback?.({ success: true });
    });

    socket.on(
      "send_message",
      async (
        payload: { roomId: string; body: string },
        callback?: (result: { success: boolean; data?: unknown; error?: string }) => void
      ) => {
        const roomId = payload?.roomId;
        const body = payload?.body?.trim();

        if (!roomId || !isValidRoomId(roomId)) {
          callback?.({ success: false, error: "Invalid room ID" });
          return;
        }
        if (!body || body.length > 2000) {
          callback?.({ success: false, error: "Message must be 1-2000 characters" });
          return;
        }
        if (!canSendMessage(user.userId)) {
          callback?.({
            success: false,
            error: "Tunggu 3 detik sebelum mengirim pesan lagi",
          });
          return;
        }

        try {
          const message = await prisma.chatMessage.create({
            data: { body, authorId: user.userId, roomId },
            include: { author: { select: { id: true, name: true } } },
          });

          const messageData = {
            id: message.id,
            body: message.body,
            roomId: message.roomId,
            authorId: message.authorId,
            authorName: message.author.name,
            createdAt: message.createdAt.toISOString(),
          };

          io.to(roomId).emit("message_received", messageData);
          callback?.({ success: true, data: messageData });
        } catch {
          callback?.({ success: false, error: "Failed to send message" });
        }
      }
    );

    socket.on("typing", (payload: { roomId: string; isTyping: boolean }) => {
      const roomId = payload?.roomId;
      if (!roomId || !isValidRoomId(roomId)) return;

      const timerKey = `${socket.id}:${roomId}`;
      const existingTimer = typingTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingTimers.delete(timerKey);
      }

      socket.to(roomId).emit("user_typing", {
        roomId,
        userId: user.userId,
        name: user.name,
        isTyping: payload.isTyping,
      });

      if (payload.isTyping) {
        const timer = setTimeout(() => {
          socket.to(roomId).emit("user_typing", {
            roomId,
            userId: user.userId,
            name: user.name,
            isTyping: false,
          });
          typingTimers.delete(timerKey);
        }, TYPING_TIMEOUT_MS);
        typingTimers.set(timerKey, timer);
      }
    });

    socket.on("disconnect", () => {
      const affectedRooms = removeUserFromAllRooms(socket.id);
      for (const roomId of affectedRooms) {
        emitRoomUsers(io, roomId);
      }

      for (const [key, timer] of typingTimers.entries()) {
        if (key.startsWith(`${socket.id}:`)) {
          clearTimeout(timer);
          typingTimers.delete(key);
        }
      }
    });
  });
}
