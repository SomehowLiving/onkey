// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {BaseAccount} from "@account-abstraction/contracts/core/BaseAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {TokenCallbackHandler} from "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title OnkeyAccount
 * @notice ERC-4337 smart account with MPC signing
 * @dev Minimal ERC-4337 account. Owner is the MPC-controlled EOA (PKP address).
 */
contract OnkeyAccount is BaseAccount, TokenCallbackHandler {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IEntryPoint private immutable _entryPoint;
    address public owner;

    uint256 internal constant SIG_VALIDATION_FAILED = 1;
    
    event OnkeyAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);

    modifier onlyOwner() {
        _requireFromEntryPointOrOwner();
        _;
    }

    constructor(IEntryPoint anEntryPoint, address anOwner) {
        _entryPoint = anEntryPoint;
        owner = anOwner;
        emit OnkeyAccountInitialized(anEntryPoint, anOwner);
    }

    /**
     * @notice Execute a transaction
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyOwner {
        _call(dest, value, func);
    }

    /**
     * @notice Execute a batch of transactions
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external onlyOwner {
        require(
            dest.length == value.length && value.length == func.length,
            "invalid array lengths"
        );

        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    function _call(
        address target,
        uint256 value,
        bytes memory data
    ) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "account: not Owner or EntryPoint"
        );
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @dev ERC-4337 v0.7 signature validation using PackedUserOperation
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(userOp.signature);

        if (signer != owner) {
            return SIG_VALIDATION_FAILED;
        }

        return 0;
    }

    receive() external payable {}
}