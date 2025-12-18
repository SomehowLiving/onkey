import { createPublicClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { logger } from '../utils/logger.js';

const FACTORY_ABI = 
    [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_entryPoint",
                    "type": "address",
                    "internalType": "contract IEntryPoint"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "createAccount",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "salt",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "contract OnkeyAccount"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "entryPoint",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IEntryPoint"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getAddress",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "salt",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "AccountCreated",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "salt",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        }
    ] as const;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
});

/**
 * Get deterministic smart account address from MPC public key
 */
export async function getSmartAccountAddress(
  mpcPublicKey: string
): Promise<Address> {
  const factoryAddress = process.env.FACTORY_ADDRESS as Address;
  
  if (!factoryAddress) {
    throw new Error('FACTORY_ADDRESS not configured');
  }

  try {
    // Use email hash or userId as salt for determinism
    const salt = BigInt(0); // Default salt, can be customized per user
    
    const address = await publicClient.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getAddress',
      args: [mpcPublicKey as Address, salt],
    });

    logger.info({ mpcPublicKey, address }, 'Smart account address computed');
    return address;
  } catch (error) {
    logger.error({ error, mpcPublicKey }, 'Failed to compute smart account address');
    throw new Error('Failed to compute smart account address');
  }
}

/**
 * Check if smart account is deployed on-chain
 */
export async function isAccountDeployed(address: Address): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address });
    return code !== undefined && code !== '0x';
  } catch (error) {
    logger.error({ error, address }, 'Failed to check account deployment');
    return false;
  }
}