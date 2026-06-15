import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RewardManager", function () {
  let coin: any;
  let whitelist: any;
  let rewardManager: any;

  let admin: SignerWithAddress;
  let backend: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let stranger: SignerWithAddress;

  const contentId = ethers.id("some-random-post-id");

  beforeEach(async function () {
    [admin, backend, student1, student2, stranger] = await ethers.getSigners();

    const WhitelistFactory = await ethers.getContractFactory("Whitelist");
    whitelist = await WhitelistFactory.deploy(admin.address);
    await whitelist.waitForDeployment();

    const CampusCoinFactory = await ethers.getContractFactory("CampusCoin");
    coin = await CampusCoinFactory.deploy(admin.address);
    await coin.waitForDeployment();

    const RewardManagerFactory = await ethers.getContractFactory("RewardManager");
    rewardManager = await RewardManagerFactory.deploy(
      admin.address,
      await coin.getAddress(),
      await whitelist.getAddress()
    );
    await rewardManager.waitForDeployment();

    const MINTER_ROLE = await coin.MINTER_ROLE();
    await coin.connect(admin).grantRole(MINTER_ROLE, await rewardManager.getAddress());

    const BACKEND_ROLE = await rewardManager.BACKEND_ROLE();
    await rewardManager.connect(admin).grantRole(BACKEND_ROLE, backend.address);

    await whitelist.connect(admin).addToWhitelist(student1.address, "10112233");
    await whitelist.connect(admin).addToWhitelist(student2.address, "10112234");
  });

  it("1. Should set the correct initial reward amounts in constructor", async function () {
    const configQ = await rewardManager.actionConfigs(0);
    expect(configQ.rewardAmount).to.equal(ethers.parseEther("5"));
    expect(configQ.cooldown).to.equal(10n * 60n);
    expect(configQ.maxPerDay).to.equal(5n);

    const configA = await rewardManager.actionConfigs(1);
    expect(configA.rewardAmount).to.equal(ethers.parseEther("10"));
    expect(configA.cooldown).to.equal(10n * 60n);
    expect(configA.maxPerDay).to.equal(10n);
  });

  it("2. Should allow backend role to add reward contributions", async function () {
    await expect(rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId))
      .to.emit(rewardManager, "RewardContributed")
      .withArgs(student1.address, 0, ethers.parseEther("5"), contentId);

    expect(await rewardManager.getRewardBalance(student1.address)).to.equal(ethers.parseEther("5"));
  });

  it("3. Should reject reward contribution calls from non-backends", async function () {
    await expect(
      rewardManager.connect(stranger).rewardContribution(student1.address, 0, contentId)
    ).to.be.revertedWithCustomError(rewardManager, "AccessControlUnauthorizedAccount");
  });

  it("4. Should reject reward contribution for non-whitelisted recipient", async function () {
    await expect(
      rewardManager.connect(backend).rewardContribution(stranger.address, 0, contentId)
    ).to.be.revertedWith("Recipient not whitelisted");
  });

  it("5. Should track and return reward balance correctly", async function () {
    await rewardManager.connect(backend).rewardContribution(student1.address, 2, contentId); // Like: 2 CSIT
    
    await ethers.provider.send("evm_increaseTime", [5 * 60]);
    await ethers.provider.send("evm_mine", []);

    await rewardManager.connect(backend).rewardContribution(student1.address, 4, contentId); // Comment: 1 CSIT
    expect(await rewardManager.getRewardBalance(student1.address)).to.equal(ethers.parseEther("3")); // 2 + 1 = 3 CSIT
  });

  it("6. Should enforce cooldown between same actions", async function () {
    await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);

    await expect(
      rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId)
    ).to.be.revertedWith("Action cooldown active");

    await ethers.provider.send("evm_increaseTime", [10 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId))
      .to.emit(rewardManager, "RewardContributed");
  });

  it("7. Should enforce daily cap limits for actions", async function () {
    for (let i = 0; i < 5; i++) {
      await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);
      await ethers.provider.send("evm_increaseTime", [10 * 60]);
      await ethers.provider.send("evm_mine", []);
    }

    await expect(
      rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId)
    ).to.be.revertedWith("Daily action limit reached");

    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId))
      .to.emit(rewardManager, "RewardContributed");
  });

  it("8. Should allow users to claim accumulated rewards to receive token on-chain", async function () {
    await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);
    await ethers.provider.send("evm_increaseTime", [10 * 60]);
    await ethers.provider.send("evm_mine", []);
    await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);

    expect(await coin.balanceOf(student1.address)).to.equal(0n);
    expect(await rewardManager.getRewardBalance(student1.address)).to.equal(ethers.parseEther("10"));

    await expect(rewardManager.connect(student1).claimDailyRewards(student1.address))
      .to.emit(rewardManager, "RewardsClaimed")
      .withArgs(student1.address, ethers.parseEther("10"));

    expect(await coin.balanceOf(student1.address)).to.equal(ethers.parseEther("10"));
    expect(await rewardManager.getRewardBalance(student1.address)).to.equal(0n);
  });

  it("9. Should revert when user claims with zero reward balance", async function () {
    await expect(
      rewardManager.connect(student1).claimDailyRewards(student1.address)
    ).to.be.revertedWith("No rewards to claim");
  });

  it("10. Should record daily statistics accurately", async function () {
    const timestamp = (await ethers.provider.getBlock("latest"))!.timestamp;

    await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);
    await rewardManager.connect(backend).rewardContribution(student1.address, 2, contentId);

    const stats = await rewardManager.getDailyStats(student1.address, timestamp);
    expect(stats.postQuestionCount).to.equal(1n);
    expect(stats.receiveLikeCount).to.equal(1n);
    expect(stats.postAnswerCount).to.equal(0n);
  });

  it("11. Should allow admin to adjust action configuration settings", async function () {
    await expect(rewardManager.connect(admin).setActionConfig(0, ethers.parseEther("10"), 60, 100))
      .to.emit(rewardManager, "ActionConfigUpdated")
      .withArgs(0, ethers.parseEther("10"), 60, 100);

    const config = await rewardManager.actionConfigs(0);
    expect(config.rewardAmount).to.equal(ethers.parseEther("10"));
    expect(config.cooldown).to.equal(60n);
    expect(config.maxPerDay).to.equal(100n);
  });

  it("12. Should reject action configuration changes from non-admins", async function () {
    await expect(
      rewardManager.connect(backend).setActionConfig(0, ethers.parseEther("10"), 60, 100)
    ).to.be.revertedWithCustomError(rewardManager, "AccessControlUnauthorizedAccount");
  });

  it("13. Should track cooldowns independently per user", async function () {
    // student1 performs PostQuestion -> starts cooldown for student1
    await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);
    
    // student2 should still be able to perform PostQuestion immediately
    await expect(rewardManager.connect(backend).rewardContribution(student2.address, 0, contentId))
      .to.emit(rewardManager, "RewardContributed");
  });

  it("14. Should track daily limits independently per user", async function () {
    // Hit daily limit of PostQuestion (5) for student1
    for (let i = 0; i < 5; i++) {
      await rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId);
      await ethers.provider.send("evm_increaseTime", [10 * 60]);
      await ethers.provider.send("evm_mine", []);
    }
    
    // student1 is now capped
    await expect(
      rewardManager.connect(backend).rewardContribution(student1.address, 0, contentId)
    ).to.be.revertedWith("Daily action limit reached");

    // student2 should still be able to perform PostQuestion
    await expect(rewardManager.connect(backend).rewardContribution(student2.address, 0, contentId))
      .to.emit(rewardManager, "RewardContributed");
  });

  it("15. Should reject deployment with zero addresses in constructor parameters", async function () {
    const RewardManagerFactory = await ethers.getContractFactory("RewardManager");
    
    await expect(
      RewardManagerFactory.deploy(ethers.ZeroAddress, coin.target, whitelist.target)
    ).to.be.revertedWith("Invalid admin address");

    await expect(
      RewardManagerFactory.deploy(admin.address, ethers.ZeroAddress, whitelist.target)
    ).to.be.revertedWith("Invalid coin address");

    await expect(
      RewardManagerFactory.deploy(admin.address, coin.target, ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid whitelist address");
  });
});

