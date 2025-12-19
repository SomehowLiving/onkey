// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {OnkeyAccountFactory} from "../src/OnkeyAccountFactory.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract DeployScript is Script {
    // Base Sepolia EntryPoint address (ERC-4337 v0.6)
    // address constant ENTRYPOINT_ADDRESS = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    // Base Sepolia EntryPoint address (ERC-4337 v0.7)
    address constant ENTRYPOINT_ADDRESS = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IEntryPoint entryPoint = IEntryPoint(ENTRYPOINT_ADDRESS);
        OnkeyAccountFactory factory = new OnkeyAccountFactory(entryPoint);

        console.log("OnkeyAccountFactory deployed at:", address(factory));
        console.log("EntryPoint address:", address(entryPoint));

        vm.stopBroadcast();
    }
}

