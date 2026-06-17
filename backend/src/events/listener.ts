import { publicClient, WHITELIST_ADDRESS } from "../config/blockchain";
import { WhitelistABI } from "../services/blockchain";
import { prisma } from "../config/database";

export function startEventListener(): void {
  console.log("🚀 On-chain Event listener initialized and listening");

  try {
    // 1. Watch Whitelisted event
    publicClient.watchContractEvent({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      eventName: "Whitelisted",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { student, nim } = log.args as any;
          if (student) {
            try {
              const lowerStudent = student.toLowerCase();
              console.log(`[On-Chain Event: Whitelisted] Syncing user ${lowerStudent} / ${nim}`);
              
              await prisma.user.updateMany({
                where: {
                  OR: [
                    { walletAddress: { equals: lowerStudent, mode: "insensitive" } },
                    { nim },
                  ],
                },
                data: { isVerified: true },
              });
            } catch (err) {
              console.error("Error syncing whitelisted user in DB:", err);
            }
          }
        }
      },
    });

    // 2. Watch WhitelistRemoved event
    publicClient.watchContractEvent({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      eventName: "WhitelistRemoved",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { student } = log.args as any;
          if (student) {
            try {
              const lowerStudent = student.toLowerCase();
              console.log(`[On-Chain Event: WhitelistRemoved] Syncing user ${lowerStudent}`);
              
              await prisma.user.updateMany({
                where: { walletAddress: { equals: lowerStudent, mode: "insensitive" } },
                data: { isVerified: false },
              });
            } catch (err) {
              console.error("Error syncing removed whitelist user in DB:", err);
            }
          }
        }
      },
    });
  } catch (error) {
    console.error("Failed to start contract event watchers:", error);
  }
}
