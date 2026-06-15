// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWhitelist {
    struct StudentInfo {
        string nim;
        bool isWhitelisted;
    }

    event Whitelisted(address indexed wallet, string nim);
    event WhitelistRemoved(address indexed wallet, string nim);

    function addToWhitelist(address wallet, string calldata nim) external;
    function removeFromWhitelist(address wallet) external;
    function isWhitelisted(address wallet) external view returns (bool);
    function getStudentInfo(address wallet) external view returns (StudentInfo memory);
}
