import hre from "hardhat";
const ethers = (hre as any).ethers;



async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Whitelist
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy(deployer.address);
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  console.log("Whitelist deployed to:", whitelistAddress);

  // Deploy CampusCoin
  const CampusCoin = await ethers.getContractFactory("CampusCoin");
  const campusCoin = await CampusCoin.deploy(deployer.address);
  await campusCoin.waitForDeployment();
  const campusCoinAddress = await campusCoin.getAddress();
  console.log("CampusCoin deployed to:", campusCoinAddress);

  // Deploy RewardManager
  const RewardManager = await ethers.getContractFactory("RewardManager");
  const rewardManager = await RewardManager.deploy(
    deployer.address,
    campusCoinAddress,
    whitelistAddress,
  );
  await rewardManager.waitForDeployment();
  const rewardManagerAddress = await rewardManager.getAddress();
  console.log("RewardManager deployed to:", rewardManagerAddress);

  // Set Minter role of CampusCoin to RewardManager
  const MINTER_ROLE = await campusCoin.MINTER_ROLE();
  const tx = await campusCoin.grantRole(MINTER_ROLE, rewardManagerAddress);
  await tx.wait();
  console.log("Granted MINTER_ROLE on CampusCoin to RewardManager");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("Whitelist:", whitelistAddress);
  console.log("CampusCoin:", campusCoinAddress);
  console.log("RewardManager:", rewardManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
