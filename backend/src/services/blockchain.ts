import { pad, toHex } from "viem";
import {
  publicClient,
  walletClient,
  account,
  WHITELIST_ADDRESS,
  CAMPUS_COIN_ADDRESS,
  REWARD_MANAGER_ADDRESS,
} from "../config/blockchain";

// Minimal ABIs for contract interactions
export const WhitelistABI = [
  {
    inputs: [{ name: "wallet", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "wallet", type: "address" }],
    name: "getStudentInfo",
    outputs: [
      {
        components: [
          { name: "nim", type: "string" },
          { name: "isWhitelisted", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "student", type: "address" },
      { name: "nim", type: "string" },
    ],
    name: "addToWhitelist",
    outputs: [],
    stateMutability: "external",
    type: "function",
  },
  {
    inputs: [{ name: "student", type: "address" }],
    name: "removeFromWhitelist",
    outputs: [],
    stateMutability: "external",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "student", type: "address" },
      { indexed: false, name: "nim", type: "string" },
    ],
    name: "Whitelisted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "student", type: "address" },
      { indexed: false, name: "nim", type: "string" },
    ],
    name: "WhitelistRemoved",
    type: "event",
  },
] as const;

export const RewardManagerABI = [
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "action", type: "uint8" },
      { name: "contentId", type: "bytes32" },
    ],
    name: "rewardContribution",
    outputs: [],
    stateMutability: "external",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getRewardBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "date", type: "uint256" },
    ],
    name: "getDailyStats",
    outputs: [
      {
        components: [
          { name: "postQuestionCount", type: "uint256" },
          { name: "postAnswerCount", type: "uint256" },
          { name: "receiveLikeCount", type: "uint256" },
          { name: "postCommentCount", type: "uint256" },
          { name: "sharePostCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CampusCoinABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function isWhitelisted(walletAddress: string): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      functionName: "isWhitelisted",
      args: [walletAddress as `0x${string}`],
    });
  } catch (error) {
    console.error("Error checking whitelist:", error);
    return false;
  }
}

export async function getStudentInfo(walletAddress: string): Promise<{ nim: string; isWhitelisted: boolean } | null> {
  try {
    const info = await publicClient.readContract({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      functionName: "getStudentInfo",
      args: [walletAddress as `0x${string}`],
    });
    return {
      nim: info.nim,
      isWhitelisted: info.isWhitelisted,
    };
  } catch (error) {
    console.error("Error fetching student info:", error);
    return null;
  }
}

export async function triggerReward(
  recipient: string,
  actionType: number,
  contentId: string
): Promise<string | null> {
  if (!walletClient || !account) {
    console.error("Wallet client not configured for rewards");
    return null;
  }

  try {
    const bytes32ContentId = contentId.startsWith("0x") && contentId.length === 66
      ? (contentId as `0x${string}`)
      : pad(toHex(contentId), { size: 32 });

    const { request } = await publicClient.simulateContract({
      address: REWARD_MANAGER_ADDRESS,
      abi: RewardManagerABI,
      functionName: "rewardContribution",
      args: [recipient as `0x${string}`, actionType, bytes32ContentId],
      account,
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  } catch (error) {
    console.error("Error triggering reward:", error);
    return null;
  }
}

export async function getOnChainBalance(walletAddress: string): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: CAMPUS_COIN_ADDRESS,
      abi: CampusCoinABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });
  } catch (error) {
    console.error("Error getting on-chain balance:", error);
    return 0n;
  }
}

export async function getUnclaimedBalance(walletAddress: string): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: REWARD_MANAGER_ADDRESS,
      abi: RewardManagerABI,
      functionName: "getRewardBalance",
      args: [walletAddress as `0x${string}`],
    });
  } catch (error) {
    console.error("Error getting unclaimed balance:", error);
    return 0n;
  }
}

export async function getDailyStatsOnChain(
  walletAddress: string,
  timestamp: number
): Promise<{
  postQuestionCount: bigint;
  postAnswerCount: bigint;
  receiveLikeCount: bigint;
  postCommentCount: bigint;
  sharePostCount: bigint;
} | null> {
  try {
    const stats = await publicClient.readContract({
      address: REWARD_MANAGER_ADDRESS,
      abi: RewardManagerABI,
      functionName: "getDailyStats",
      args: [walletAddress as `0x${string}`, BigInt(timestamp)],
    });
    return {
      postQuestionCount: stats.postQuestionCount,
      postAnswerCount: stats.postAnswerCount,
      receiveLikeCount: stats.receiveLikeCount,
      postCommentCount: stats.postCommentCount,
      sharePostCount: stats.sharePostCount,
    };
  } catch (error) {
    console.error("Error getting daily stats:", error);
    return null;
  }
}

// Whitelist write operations
export async function addToWhitelistOnChain(walletAddress: string, nim: string): Promise<string | null> {
  if (!walletClient || !account) {
    console.error("Wallet client not configured for admin");
    return null;
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      functionName: "addToWhitelist",
      args: [walletAddress as `0x${string}`, nim],
      account,
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  } catch (error) {
    console.error("Error adding to whitelist on-chain:", error);
    return null;
  }
}

export async function removeFromWhitelistOnChain(walletAddress: string): Promise<string | null> {
  if (!walletClient || !account) {
    console.error("Wallet client not configured for admin");
    return null;
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: WHITELIST_ADDRESS,
      abi: WhitelistABI,
      functionName: "removeFromWhitelist",
      args: [walletAddress as `0x${string}`],
      account,
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  } catch (error) {
    console.error("Error removing from whitelist on-chain:", error);
    return null;
  }
}
