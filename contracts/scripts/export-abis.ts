import * as fs from "fs";
import * as path from "path";

function main() {
  const contractsDir = path.join(__dirname, "..");
  const artifactsDir = path.join(contractsDir, "artifacts", "contracts");
  const frontendLibDir = path.join(contractsDir, "..", "frontend", "lib");
  
  const coinArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "CampusCoin.sol", "CampusCoin.json"), "utf8"));
  const rewardArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "RewardManager.sol", "RewardManager.json"), "utf8"));
  const whitelistArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "Whitelist.sol", "Whitelist.json"), "utf8"));

  const outputContent = `export const CAMPUS_COIN_ADDRESS =
  (process.env.NEXT_PUBLIC_CAMPUS_COIN_ADDRESS as \`0x\${string}\`) ??
  "0x0000000000000000000000000000000000000000";

export const REWARD_MANAGER_ADDRESS =
  (process.env.NEXT_PUBLIC_REWARD_MANAGER_ADDRESS as \`0x\${string}\`) ??
  "0x0000000000000000000000000000000000000000";

export const WHITELIST_ADDRESS =
  (process.env.NEXT_PUBLIC_WHITELIST_ADDRESS as \`0x\${string}\`) ??
  "0x0000000000000000000000000000000000000000";

export const campusCoinAbi = ${JSON.stringify(coinArtifact.abi, null, 2)} as const;

export const rewardManagerAbi = ${JSON.stringify(rewardArtifact.abi, null, 2)} as const;

export const whitelistAbi = ${JSON.stringify(whitelistArtifact.abi, null, 2)} as const;

export const REWARD_ACTION_LABELS: Record<string, string> = {
  postQuestion: "Buat Pertanyaan",
  postAnswer: "Jawab Pertanyaan",
  receiveLike: "Menerima Like",
  bestAnswerSelected: "Best Answer",
  postComment: "Komentar",
  sharePost: "Share Post",
};
`;

  fs.writeFileSync(path.join(frontendLibDir, "contracts.ts"), outputContent, "utf8");
  console.log("ABIs successfully exported to frontend/lib/contracts.ts!");
}

main();
