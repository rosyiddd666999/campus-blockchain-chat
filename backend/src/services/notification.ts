import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIoInstance(io: Server): void {
  ioInstance = io;
}

export function getIoInstance(): Server | null {
  return ioInstance;
}

export interface QuestionPayload {
  postId: string;
  title: string;
  authorId: string;
  authorName: string;
}

export interface AnswerPayload {
  postId: string;
  answerId: string;
  authorId: string;
  authorName: string;
}

export interface RewardPayload {
  userId: string;
  walletAddress: string;
  action: string;
  amount: number;
  txHash?: string;
}

export interface BestAnswerPayload {
  postId: string;
  answerId: string;
  authorId: string;
  authorName: string;
}

export function broadcastNewQuestion(payload: QuestionPayload): void {
  ioInstance?.emit("new_question", payload);
}

export function broadcastNewAnswer(payload: AnswerPayload): void {
  ioInstance?.emit("new_answer", payload);
}

export function broadcastRewardReceived(payload: RewardPayload): void {
  ioInstance?.to(`user:${payload.userId}`).emit("reward_received", payload);
  ioInstance?.emit("reward_received", payload);
}

export function broadcastBestAnswerSelected(payload: BestAnswerPayload): void {
  ioInstance?.emit("best_answer_selected", payload);
}

export function buildQuestionRoomId(postId: string): string {
  return `question:${postId}`;
}

export function buildAngkatanRoomId(angkatan: number): string {
  return `angkatan:${angkatan}`;
}

export function isValidRoomId(roomId: string): boolean {
  if (roomId === "general") return true;
  if (/^question:[a-zA-Z0-9_-]+$/.test(roomId)) return true;
  if (/^angkatan:\d{4}$/.test(roomId)) return true;
  return false;
}
