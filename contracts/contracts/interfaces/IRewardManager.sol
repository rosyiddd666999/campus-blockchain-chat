// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRewardManager {
    enum ActionType {
        PostQuestion,
        PostAnswer,
        ReceiveLike,
        BestAnswerSelected,
        PostComment,
        SharePost
    }

    struct DailyStats {
        uint256 postQuestionCount;
        uint256 postAnswerCount;
        uint256 receiveLikeCount;
        uint256 postCommentCount;
        uint256 sharePostCount;
    }

    event RewardContributed(address indexed recipient, ActionType action, uint256 amount, bytes32 contentId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ActionConfigUpdated(ActionType action, uint256 rewardAmount, uint256 cooldown, uint256 maxPerDay);

    function rewardContribution(address recipient, ActionType action, bytes32 contentId) external;
    function claimDailyRewards(address user) external;
    function getRewardBalance(address user) external view returns (uint256);
    function getDailyStats(address user, uint256 date) external view returns (DailyStats memory);
}
