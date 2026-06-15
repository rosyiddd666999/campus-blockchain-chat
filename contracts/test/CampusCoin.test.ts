import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CampusCoin", function () {
  let coin: any;
  let admin: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [admin, minter, user1, user2] = await ethers.getSigners();

    const CampusCoinFactory = await ethers.getContractFactory("CampusCoin");
    coin = await CampusCoinFactory.deploy(admin.address);
    await coin.waitForDeployment();

    const MINTER_ROLE = await coin.MINTER_ROLE();
    await coin.connect(admin).grantRole(MINTER_ROLE, minter.address);
  });

  it("1. Should initialize with correct ERC-20 metadata", async function () {
    expect(await coin.name()).to.equal("Campus Informatika Token");
    expect(await coin.symbol()).to.equal("CSIT");
    expect(await coin.decimals()).to.equal(18n);
  });

  it("2. Should assign DEFAULT_ADMIN_ROLE and PAUSER_ROLE to deployer/admin", async function () {
    const DEFAULT_ADMIN_ROLE = await coin.DEFAULT_ADMIN_ROLE();
    const PAUSER_ROLE = await coin.PAUSER_ROLE();

    expect(await coin.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    expect(await coin.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
  });

  it("3. Should allow minter role to mint tokens", async function () {
    const amount = ethers.parseEther("100");
    await expect(coin.connect(minter).mint(user1.address, amount))
      .to.emit(coin, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, amount);

    expect(await coin.balanceOf(user1.address)).to.equal(amount);
  });

  it("4. Should reject minting from non-minters", async function () {
    const amount = ethers.parseEther("100");
    await expect(
      coin.connect(user1).mint(user2.address, amount)
    ).to.be.revertedWithCustomError(coin, "AccessControlUnauthorizedAccount");
  });

  it("5. Should enforce hard cap of 10,000,000 CSIT", async function () {
    const maxCap = ethers.parseEther("10000000");
    await coin.connect(minter).mint(user1.address, maxCap);
    expect(await coin.totalSupply()).to.equal(maxCap);

    await expect(
      coin.connect(minter).mint(user1.address, ethers.parseEther("1"))
    ).to.be.revertedWith("CampusCoin: cap exceeded");
  });

  it("6. Should allow minter to burn tokens", async function () {
    const amount = ethers.parseEther("100");
    await coin.connect(minter).mint(user1.address, amount);

    await expect(coin.connect(minter).burn(user1.address, ethers.parseEther("40")))
      .to.emit(coin, "Transfer")
      .withArgs(user1.address, ethers.ZeroAddress, ethers.parseEther("40"));

    expect(await coin.balanceOf(user1.address)).to.equal(ethers.parseEther("60"));
  });

  it("7. Should reject burning from non-minters", async function () {
    const amount = ethers.parseEther("100");
    await coin.connect(minter).mint(user1.address, amount);

    await expect(
      coin.connect(user1).burn(user1.address, ethers.parseEther("40"))
    ).to.be.revertedWithCustomError(coin, "AccessControlUnauthorizedAccount");
  });

  it("8. Should allow pauser to pause and unpause transfers", async function () {
    await expect(coin.connect(admin).pause())
      .to.emit(coin, "Paused")
      .withArgs(admin.address);

    expect(await coin.paused()).to.be.true;

    await expect(coin.connect(admin).unpause())
      .to.emit(coin, "Unpaused")
      .withArgs(admin.address);

    expect(await coin.paused()).to.be.false;
  });

  it("9. Should reject pause/unpause from non-pauser", async function () {
    await expect(
      coin.connect(user1).pause()
    ).to.be.revertedWithCustomError(coin, "AccessControlUnauthorizedAccount");
  });

  it("10. Should block transfers when paused", async function () {
    const amount = ethers.parseEther("100");
    await coin.connect(minter).mint(user1.address, amount);

    await coin.connect(admin).pause();

    await expect(
      coin.connect(user1).transfer(user2.address, ethers.parseEther("10"))
    ).to.be.revertedWithCustomError(coin, "EnforcedPause");
  });

  it("11. Should block minting and burning when paused", async function () {
    const amount = ethers.parseEther("100");
    await coin.connect(minter).mint(user1.address, amount);

    await coin.connect(admin).pause();

    await expect(
      coin.connect(minter).mint(user2.address, ethers.parseEther("10"))
    ).to.be.revertedWithCustomError(coin, "EnforcedPause");

    await expect(
      coin.connect(minter).burn(user1.address, ethers.parseEther("10"))
    ).to.be.revertedWithCustomError(coin, "EnforcedPause");
  });
});
