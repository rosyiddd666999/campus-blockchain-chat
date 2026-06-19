import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors"; // Import konektor MetaMask langsung

export const config = createConfig({
  chains: [sepolia],
  // Daftarkan konektor bawaan browser (MetaMask/Injected Wallet)
  connectors: [injected()], 
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
        "https://ethereum-sepolia-rpc.publicnode.com"
    ),
  },
  ssr: true,
});