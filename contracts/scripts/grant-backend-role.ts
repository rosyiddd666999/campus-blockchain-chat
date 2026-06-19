import hre from "hardhat";
const ethers = (hre as any).ethers;

async function main() {
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS;
  if (!rewardManagerAddress) {
    console.error("Please set REWARD_MANAGER_ADDRESS in env");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const RewardManager = await ethers.getContractAt("RewardManager", rewardManagerAddress);

  const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));
  console.log("BACKEND_ROLE:", BACKEND_ROLE);

  // Check if deployer already has the role
  const hasRole = await RewardManager.hasRole(BACKEND_ROLE, deployer.address);
  console.log(`Deployer has BACKEND_ROLE: ${hasRole}`);

  if (!hasRole) {
    console.log("Granting BACKEND_ROLE to deployer:", deployer.address);
    const tx = await RewardManager.grantRole(BACKEND_ROLE, deployer.address);
    await tx.wait();
    console.log("Transaction:", tx.hash);
    console.log("BACKEND_ROLE granted successfully!");
  } else {
    console.log("BACKEND_ROLE already granted - nothing to do.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
