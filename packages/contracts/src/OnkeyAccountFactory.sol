// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {OnkeyAccount} from "./OnkeyAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";

/**
 * @title OnkeyAccountFactory
 * @notice Factory for creating OnkeyAccount instances using CREATE2
 * @dev Enables deterministic address generation before deployment
 */
contract OnkeyAccountFactory {
    IEntryPoint public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
    }

    /**
     * @notice Create a new OnkeyAccount instance
     * @param owner The owner address (MPC public key)
     * @param salt Salt for deterministic address generation
     * @return account The address of the created account
     */
    function createAccount(address owner, uint256 salt) external returns (OnkeyAccount account) {
        bytes32 saltBytes = bytes32(salt);
        address predicted = this.getAddress(owner, salt);

        if (predicted.code.length > 0) {
            return OnkeyAccount(payable(predicted));
        }

        account = new OnkeyAccount{salt: saltBytes}(entryPoint, owner);
        emit AccountCreated(address(account), owner, salt);
    }

    /**
     * @notice Get the address of an account that would be created
     * @param owner The owner address (MPC public key)
     * @param salt Salt for deterministic address generation
     * @return The address of the account that would be created
     */
    function getAddress(address owner, uint256 salt) external view returns (address) {
        bytes32 saltBytes = bytes32(salt);
        bytes memory bytecode = abi.encodePacked(
            type(OnkeyAccount).creationCode,
            abi.encode(entryPoint, owner)
        );

        return Create2.computeAddress(saltBytes, keccak256(bytecode));
    }
}