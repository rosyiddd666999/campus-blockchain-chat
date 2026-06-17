import { prisma } from "../config/database";
import { triggerReward } from "./blockchain";
import { broadcastRewardReceived } from "./notification";

export const ActionMapping: Record<string, { index: number; amount: number }> = {
  PostQuestion: { index: 0, amount: 5 },
  PostAnswer: { index: 1, amount: 10 },
  ReceiveLike: { index: 2, amount: 2 },
  BestAnswerSelected: { index: 3, amount: 20 },
  PostComment: { index: 4, amount: 1 },
  SharePost: { index: 5, amount: 1 },
};

export async function distributeReward(
  userId: string,
  action: keyof typeof ActionMapping,
  contentId: string
): Promise<{ success: boolean; txHash?: string; amount?: number; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.isVerified) {
      return { success: false, error: "User is not whitelisted/verified" };
    }

    const mapping = ActionMapping[action];
    if (!mapping) {
      return { success: false, error: "Invalid action type" };
    }

    // Trigger on-chain reward transaction
    const txHash = await triggerReward(user.walletAddress, mapping.index, contentId);
    if (!txHash) {
      return { success: false, error: "Failed to submit on-chain transaction" };
    }

    // Log to DB
    const amount = mapping.amount;
    await prisma.rewardHistory.create({
      data: {
        userId,
        action,
        amount,
        txHash,
        contentId,
      },
    });

    // Broadcast Socket.io notification
    broadcastRewardReceived({
      userId: user.id,
      walletAddress: user.walletAddress,
      action,
      amount,
      txHash,
    });

    return { success: true, txHash, amount };
  } catch (error) {
    console.error("Error distributing reward:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
