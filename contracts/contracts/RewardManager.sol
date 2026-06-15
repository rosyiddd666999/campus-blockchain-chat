// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRewardManager.sol";
import "./interfaces/ICampusCoin.sol";
import "./interfaces/IWhitelist.sol";

contract RewardManager is AccessControl, IRewardManager {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct ActionConfig {
        uint256 rewardAmount;
        uint256 cooldown;
        uint256 maxPerDay;
    }

    ICampusCoin public immutable campusCoin;
    IWhitelist public immutable whitelist;

    mapping(ActionType => ActionConfig) public actionConfigs;
    mapping(address => uint256) private _unclaimedRewards;
    mapping(address => mapping(ActionType => uint256)) private _lastActionTime;
    mapping(address => mapping(ActionType => mapping(uint256 => uint256))) private _dailyActionCount;

    constructor(address admin, address coinAddress, address whitelistAddress) {
        require(admin != address(0), "Invalid admin address");
        require(coinAddress != address(0), "Invalid coin address");
        require(whitelistAddress != address(0), "Invalid whitelist address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        campusCoin = ICampusCoin(coinAddress);
        whitelist = IWhitelist(whitelistAddress);

        // Setup default config values as per reward matrix
        actionConfigs[ActionType.PostQuestion] = ActionConfig(5 * 10**18, 10 minutes, 5);
        actionConfigs[ActionType.PostAnswer] = ActionConfig(10 * 10**18, 10 minutes, 10);
        actionConfigs[ActionType.ReceiveLike] = ActionConfig(2 * 10**18, 0, 25);
        actionConfigs[ActionType.BestAnswerSelected] = ActionConfig(20 * 10**18, 0, type(uint256).max);
        actionConfigs[ActionType.PostComment] = ActionConfig(1 * 10**18, 5 minutes, 20);
        actionConfigs[ActionType.SharePost] = ActionConfig(1 * 10**18, 30 minutes, 5);
    }

    function rewardContribution(
        address recipient,
        ActionType action,
        bytes32 contentId
    ) external onlyRole(BACKEND_ROLE) {
        require(whitelist.isWhitelisted(recipient), "Recipient not whitelisted");

        ActionConfig memory config = actionConfigs[action];
        uint256 currentDay = block.timestamp / 1 days;

        // Check daily cap
        if (config.maxPerDay != type(uint256).max) {
            require(_dailyActionCount[recipient][action][currentDay] < config.maxPerDay, "Daily action limit reached");
        }

        // Check cooldown
        if (config.cooldown > 0) {
            require(block.timestamp >= _lastActionTime[recipient][action] + config.cooldown, "Action cooldown active");
            _lastActionTime[recipient][action] = block.timestamp;
        }

        // Update stats
        _dailyActionCount[recipient][action][currentDay]++;

        // Add reward amount
        _unclaimedRewards[recipient] += config.rewardAmount;

        emit RewardContributed(recipient, action, config.rewardAmount, contentId);
    }

    function claimDailyRewards(address user) external {
        uint256 amount = _unclaimedRewards[user];
        require(amount > 0, "No rewards to claim");

        _unclaimedRewards[user] = 0;
        campusCoin.mint(user, amount);

        emit RewardsClaimed(user, amount);
    }

    function getRewardBalance(address user) external view returns (uint256) {
        return _unclaimedRewards[user];
    }

    function getDailyStats(address user, uint256 date) external view returns (DailyStats memory) {
        uint256 day = date / 1 days;
        return DailyStats({
            postQuestionCount: _dailyActionCount[user][ActionType.PostQuestion][day],
            postAnswerCount: _dailyActionCount[user][ActionType.PostAnswer][day],
            receiveLikeCount: _dailyActionCount[user][ActionType.ReceiveLike][day],
            postCommentCount: _dailyActionCount[user][ActionType.PostComment][day],
            sharePostCount: _dailyActionCount[user][ActionType.SharePost][day]
        });
    }

    function setActionConfig(
        ActionType action,
        uint256 rewardAmount,
        uint256 cooldown,
        uint256 maxPerDay
    ) external onlyRole(ADMIN_ROLE) {
        actionConfigs[action] = ActionConfig(rewardAmount, cooldown, maxPerDay);
        emit ActionConfigUpdated(action, rewardAmount, cooldown, maxPerDay);
    }
}
