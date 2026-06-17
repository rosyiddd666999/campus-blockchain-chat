import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const rpcUrl = process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

export const account = privateKey
  ? privateKeyToAccount(privateKey as `0x${string}`)
  : null;

export const walletClient = account
  ? createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })
  : null;

export const CAMPUS_COIN_ADDRESS = process.env.CAMPUS_COIN_ADDRESS as `0x${string}`;
export const REWARD_MANAGER_ADDRESS = process.env.REWARD_MANAGER_ADDRESS as `0x${string}`;
export const WHITELIST_ADDRESS = process.env.WHITELIST_ADDRESS as `0x${string}`;
