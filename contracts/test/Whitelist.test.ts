import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Whitelist", function () {
  let whitelist: any;
  let admin: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    [admin, student1, student2, stranger] = await ethers.getSigners();

    const WhitelistFactory = await ethers.getContractFactory("Whitelist");
    whitelist = await WhitelistFactory.deploy(admin.address);
    await whitelist.waitForDeployment();
  });

  it("1. Should assign DEFAULT_ADMIN_ROLE and ADMIN_ROLE to deployer/admin", async function () {
    const DEFAULT_ADMIN_ROLE = await whitelist.DEFAULT_ADMIN_ROLE();
    const ADMIN_ROLE = await whitelist.ADMIN_ROLE();

    expect(await whitelist.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    expect(await whitelist.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
  });

  it("2. Should allow admin to add a student to the whitelist", async function () {
    await expect(whitelist.connect(admin).addToWhitelist(student1.address, "10112233"))
      .to.emit(whitelist, "Whitelisted")
      .withArgs(student1.address, "10112233");

    expect(await whitelist.isWhitelisted(student1.address)).to.be.true;
  });

  it("3. Should reject whitelist addition from non-admin", async function () {
    await expect(
      whitelist.connect(stranger).addToWhitelist(student1.address, "10112233")
    ).to.be.revertedWithCustomError(whitelist, "AccessControlUnauthorizedAccount");
  });

  it("4. Should reject empty NIM or zero wallet address", async function () {
    await expect(
      whitelist.connect(admin).addToWhitelist(ethers.ZeroAddress, "10112233")
    ).to.be.revertedWith("Invalid wallet address");

    await expect(
      whitelist.connect(admin).addToWhitelist(student1.address, "")
    ).to.be.revertedWith("NIM cannot be empty");
  });

  it("5. Should reject duplicate whitelisting of the same wallet", async function () {
    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    await expect(
      whitelist.connect(admin).addToWhitelist(student1.address, "10112234")
    ).to.be.revertedWith("Wallet already whitelisted");
  });

  it("6. Should reject duplicate whitelisting of the same NIM", async function () {
    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    await expect(
      whitelist.connect(admin).addToWhitelist(student2.address, "10112233")
    ).to.be.revertedWith("NIM already registered");
  });

  it("7. Should allow admin to remove a student from the whitelist", async function () {
    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    await expect(whitelist.connect(admin).removeFromWhitelist(student1.address))
      .to.emit(whitelist, "WhitelistRemoved")
      .withArgs(student1.address, "10112233");

    expect(await whitelist.isWhitelisted(student1.address)).to.be.false;
  });

  it("8. Should reject whitelist removal from non-admin", async function () {
    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    await expect(
      whitelist.connect(stranger).removeFromWhitelist(student1.address)
    ).to.be.revertedWithCustomError(whitelist, "AccessControlUnauthorizedAccount");
  });

  it("9. Should reject removal of a wallet that is not whitelisted", async function () {
    await expect(
      whitelist.connect(admin).removeFromWhitelist(student1.address)
    ).to.be.revertedWith("Wallet not whitelisted");
  });

  it("10. Should return student info correctly when queried", async function () {
    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    const info = await whitelist.getStudentInfo(student1.address);
    expect(info.nim).to.equal("10112233");
    expect(info.isWhitelisted).to.be.true;
  });

  it("11. Should revert student info query for non-whitelisted wallet", async function () {
    await expect(
      whitelist.getStudentInfo(stranger.address)
    ).to.be.revertedWith("Wallet not whitelisted");
  });
});
