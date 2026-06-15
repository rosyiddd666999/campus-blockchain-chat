// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IWhitelist.sol";

contract Whitelist is AccessControl, IWhitelist {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => StudentInfo) private _students;
    mapping(string => address) private _nimToWallet;

    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function addToWhitelist(address wallet, string calldata nim) external onlyRole(ADMIN_ROLE) {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(nim).length > 0, "NIM cannot be empty");
        
        if (_students[wallet].isWhitelisted) {
            revert("Wallet already whitelisted");
        }
        if (_nimToWallet[nim] != address(0)) {
            revert("NIM already registered");
        }

        _students[wallet] = StudentInfo({
            nim: nim,
            isWhitelisted: true
        });
        _nimToWallet[nim] = wallet;

        emit Whitelisted(wallet, nim);
    }

    function removeFromWhitelist(address wallet) external onlyRole(ADMIN_ROLE) {
        if (!_students[wallet].isWhitelisted) {
            revert("Wallet not whitelisted");
        }
        string memory nim = _students[wallet].nim;
        
        _students[wallet].isWhitelisted = false;
        delete _nimToWallet[nim];

        emit WhitelistRemoved(wallet, nim);
    }

    function isWhitelisted(address wallet) external view returns (bool) {
        return _students[wallet].isWhitelisted;
    }

    function getStudentInfo(address wallet) external view returns (StudentInfo memory) {
        require(_students[wallet].isWhitelisted, "Wallet not whitelisted");
        return _students[wallet];
    }
}
