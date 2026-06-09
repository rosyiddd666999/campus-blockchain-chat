import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

// We use a dummy project ID if no environment variable is provided.
// A RainbowKit project ID is required for WalletConnect.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19bc3d3d2";

export const config = getDefaultConfig({
  appName: "ICP Chat",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
