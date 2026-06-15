import { ethers } from "hardhat";

async function main() {
  const whitelistAddress = process.env.WHITELIST_ADDRESS;
  if (!whitelistAddress) {
    console.error("Please set WHITELIST_ADDRESS in env");
    process.exit(1);
  }

  const Whitelist = await ethers.getContractAt("Whitelist", whitelistAddress);

  const students = [
    { wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", nim: "10112201" },
    { wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", nim: "10112202" },
    { wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", nim: "10112203" },
    { wallet: "0x15d34AAf54a67C643049377059723229E6a63581", nim: "10112204" },
    { wallet: "0x9965507D1a05cc2697C7452C953158fB6E60A889", nim: "10112205" }
  ];

  console.log("Seeding whitelist on Whitelist at:", whitelistAddress);

  for (const student of students) {
    const whitelisted = await Whitelist.isWhitelisted(student.wallet);
    if (!whitelisted) {
      console.log(`Adding ${student.nim} (${student.wallet}) to whitelist...`);
      const tx = await Whitelist.addToWhitelist(student.wallet, student.nim);
      await tx.wait();
      console.log(`Successfully added ${student.nim}`);
    } else {
      console.log(`${student.nim} (${student.wallet}) is already whitelisted`);
    }
  }

  console.log("Seeding completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
