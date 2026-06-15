import { run } from "hardhat";

async function main() {
  const whitelistAddress = process.env.WHITELIST_ADDRESS || "";
  const campusCoinAddress = process.env.CAMPUS_COIN_ADDRESS || "";
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || "";
  const adminAddress = process.env.ADMIN_ADDRESS || "";

  if (!whitelistAddress || !campusCoinAddress || !rewardManagerAddress || !adminAddress) {
    console.error("Please set WHITELIST_ADDRESS, CAMPUS_COIN_ADDRESS, REWARD_MANAGER_ADDRESS, and ADMIN_ADDRESS in your env.");
    process.exit(1);
  }

  console.log("Verifying Whitelist...");
  try {
    await run("verify:verify", {
      address: whitelistAddress,
      constructorArguments: [adminAddress],
    });
  } catch (error) {
    console.error("Error verifying Whitelist:", error);
  }

  console.log("Verifying CampusCoin...");
  try {
    await run("verify:verify", {
      address: campusCoinAddress,
      constructorArguments: [adminAddress],
    });
  } catch (error) {
    console.error("Error verifying CampusCoin:", error);
  }

  console.log("Verifying RewardManager...");
  try {
    await run("verify:verify", {
      address: rewardManagerAddress,
      constructorArguments: [adminAddress, campusCoinAddress, whitelistAddress],
    });
  } catch (error) {
    console.error("Error verifying RewardManager:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
