 const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
const path = require("path");

// Membaca file .env dengan aman
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
  console.error("⚠️ ERROR: SEPOLIA_RPC_URL atau PRIVATE_KEY tidak terbaca di .env!");
  process.exit(1);
}

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

module.exports = config;