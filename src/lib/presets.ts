export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type Preset = {
  label: string;
  provider: ProviderId;
  method: RequestMethod;
  path: string;
  query?: string;
  body?: string;
};

export type PresetGroup = {
  category: string;
  presets: Preset[];
};

export type ProviderId =
  | 'fireblocks'
  | 'allium'
  | 'coinapi'
  | 'bitgo'
  | 'atb'
  | 'allnodes';

export const fireblockPresetsGrouped: PresetGroup[] = [
  {
    category: 'Vault',
    presets: [
      {
        label: 'Vault Accounts',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/vault/accounts_paged',
        query: '{\n  "limit": 10\n}',
      },
      {
        label: 'Vault Account Details',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/vault/accounts/{vaultAccountId}',
      },
      {
        label: 'Vault Asset Addresses',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/vault/accounts/{vaultAccountId}/{assetId}/addresses_paginated',
      },
    ],
  },
  {
    category: 'Transactions',
    presets: [
      {
        label: 'Transactions',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/transactions',
        query: '{\n  "limit": 10\n}',
      },
      {
        label: 'Transaction Details',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/transactions/{txId}',
      },
    ],
  },
  {
    category: 'Assets & Blockchains',
    presets: [
      {
        label: 'Assets',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/assets',
      },
      {
        label: 'Supported Assets',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/supported_assets',
      },
      {
        label: 'Blockchains',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/blockchains',
      },
      {
        label: 'Blockchain Details',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/blockchains/{blockchainId}',
      },
    ],
  },
  {
    category: 'Other',
    presets: [
      {
        label: 'Contracts',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/contracts',
      },
      {
        label: 'Gas Station',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/gas_station',
      },
      {
        label: 'Onchain Data',
        provider: 'fireblocks',
        method: 'GET',
        path: '/v1/onchain_data/base_asset_id/{baseAssetId}/contract_address/{contractAddress}/total_supply',
      },
    ],
  },
];

export const alliumPresetsGrouped: PresetGroup[] = [
  {
    category: 'Wallet',
    presets: [
      {
        label: 'Wallet Transactions',
        provider: 'allium',
        method: 'POST',
        path: '/api/v1/developer/wallet/transactions',
        body: '[\n  {\n    "chain": "ethereum",\n    "address": "0x0000000000000000000000000000000000000001"\n  }\n]',
      },
      {
        label: 'Wallet Balances',
        provider: 'allium',
        method: 'POST',
        path: '/api/v1/developer/wallet/balances',
        body: '[\n  {\n    "chain": "ethereum",\n    "address": "0x0000000000000000000000000000000000000001"\n  }\n]',
      },
      {
        label: 'Wallet Balance History',
        provider: 'allium',
        method: 'POST',
        path: '/api/v1/developer/wallet/balances/history',
        body: '{\n  "addresses": [\n    {\n      "chain": "ethereum",\n      "address": "0x0000000000000000000000000000000000000001"\n    }\n  ],\n  "start_timestamp": "2024-01-01T00:00:00Z",\n  "end_timestamp": "2024-01-31T23:59:59Z"\n}',
      },
    ],
  },
  {
    category: 'Tokens & Assets',
    presets: [
      {
        label: 'List Tokens',
        provider: 'allium',
        method: 'GET',
        path: '/api/v1/developer/tokens',
        query: '{\n  "sort": "volume",\n  "order": "desc",\n  "limit": 200\n}',
      },
      {
        label: 'Token Transfers',
        provider: 'allium',
        method: 'GET',
        path: '/api/v1/developer/tokens/transfers',
        query: '{\n  "chain": "ethereum"\n}',
      },
      {
        label: 'Assets',
        provider: 'allium',
        method: 'GET',
        path: '/api/v1/developer/assets',
        query: '{\n  "chain": "ethereum"\n}',
      },
    ],
  },
];

export const coinapiPresetsGrouped: PresetGroup[] = [
  {
    category: 'Exchange Rates',
    presets: [
      {
        label: 'Get Exchange Rate',
        provider: 'coinapi',
        method: 'GET',
        path: '/v1/exchangerate/BTC/USD',
      },
      {
        label: 'Get Base Asset Rates',
        provider: 'coinapi',
        method: 'GET',
        path: '/v1/exchangerate/BTC',
      },
    ],
  },
];

// Defaults resolve against the unity-dependencies BitGo mock so presets run
// unedited in mockoon mode. Real mode needs your own coin, wallet, and
// enterprise ids.
const MOCK_COIN = 'hteth';
const MOCK_WALLET_ID = '59cd72485007a239fae4aa1ffdd5ab52';
const MOCK_TRANSFER_ID = 'aaaa0001000040008fb0000000000001';

// Resolved server-side per target: BITGO_ENTERPRISE_ID for real, the mock's
// enterprise for mockoon.
const ENTERPRISE_ID = '{enterpriseId}';

export const bitgoPresetsGrouped: PresetGroup[] = [
  {
    category: 'Wallets',
    presets: [
      {
        label: 'List Wallets (Coin)',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/${MOCK_COIN}/wallet`,
        query: '{\n  "limit": 50\n}',
      },
      {
        // BitGo accepts ?enterprise= here but does not filter on it, so the
        // preset omits it rather than implying a filter that does nothing.
        label: 'List All Wallets',
        provider: 'bitgo',
        method: 'GET',
        path: '/api/v2/wallets',
      },
      {
        label: 'Get Wallet',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/${MOCK_COIN}/wallet/${MOCK_WALLET_ID}`,
      },
      {
        label: 'Wallet Addresses',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/${MOCK_COIN}/wallet/${MOCK_WALLET_ID}/addresses`,
      },
    ],
  },
  {
    category: 'Transfers',
    presets: [
      {
        label: 'List Wallet Transfers',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/${MOCK_COIN}/wallet/${MOCK_WALLET_ID}/transfer`,
        query: '{\n  "limit": 50\n}',
      },
      {
        label: 'Get Transfer',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/${MOCK_COIN}/wallet/${MOCK_WALLET_ID}/transfer/${MOCK_TRANSFER_ID}`,
      },
      {
        label: 'List Enterprise Transfers',
        provider: 'bitgo',
        method: 'GET',
        path: `/api/v2/enterprise/${ENTERPRISE_ID}/transfer`,
        query: '{\n  "limit": 50\n}',
      },
    ],
  },
  {
    category: 'Reference',
    presets: [
      {
        label: 'Client Constants',
        provider: 'bitgo',
        method: 'GET',
        path: '/api/v1/client/constants',
      },
    ],
  },
];

const ATB_ACCOUNT_ID = '{accountId}';

const ZERO_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';

const ALLNODES_CHAIN_LABEL = {
  btc: 'BTC',
  eth: 'ETH',
  'eth-archive': 'ETH archive',
  base: 'BASE',
  'base-archive': 'BASE archive',
  tempo: 'TEMPO',
  basesepolia: 'BaseSepolia',
  ethsepolia: 'ETHSepolia',
} as const;

type AllnodesPresetChain = keyof typeof ALLNODES_CHAIN_LABEL;

function allnodesPreset(
  chain: AllnodesPresetChain,
  rpcMethod: string,
  params: unknown[] = [],
  jsonrpc: '1.0' | '2.0' = '2.0',
  path = `/${chain}`,
): Preset {
  return {
    label: `${ALLNODES_CHAIN_LABEL[chain]} ${rpcMethod}`,
    provider: 'allnodes',
    method: 'POST',
    path,
    body: JSON.stringify({ jsonrpc, id: 1, method: rpcMethod, params }, null, 2),
  };
}

function evmChainPresets(chain: Exclude<AllnodesPresetChain, 'btc'>): Preset[] {
  return [
    allnodesPreset(chain, 'eth_chainId'),
    allnodesPreset(chain, 'eth_blockNumber'),
    allnodesPreset(chain, 'eth_syncing'),
    allnodesPreset(chain, 'web3_clientVersion'),
    allnodesPreset(chain, 'eth_getBlockByNumber', ['latest', false]),
    allnodesPreset(chain, 'eth_getBlockByHash', ['{blockHash}', false]),
    allnodesPreset(chain, 'eth_getBlockReceipts', ['latest']),
    allnodesPreset(chain, 'eth_getBalance', [ZERO_EVM_ADDRESS, 'latest']),
    allnodesPreset(chain, 'eth_getTransactionByHash', ['{txHash}']),
    allnodesPreset(chain, 'eth_getTransactionReceipt', ['{txHash}']),
    allnodesPreset(chain, 'eth_getLogs', [
      { fromBlock: 'latest', toBlock: 'latest' },
    ]),
    allnodesPreset(chain, 'eth_call', [
      { to: ZERO_EVM_ADDRESS, data: '0x' },
      'latest',
    ]),
    allnodesPreset(chain, 'eth_getCode', [ZERO_EVM_ADDRESS, 'latest']),
    allnodesPreset(chain, 'eth_getStorageAt', [
      ZERO_EVM_ADDRESS,
      '0x0',
      'latest',
    ]),
  ];
}

export const atbPresetsGrouped: PresetGroup[] = [
  {
    category: 'Accounts',
    presets: [
      {
        label: 'List Accounts',
        provider: 'atb',
        method: 'GET',
        path: '/fdx/5.3/accounts',
        query: '{\n  "limit": 100,\n  "resultType": "details"\n}',
      },
    ],
  },
  {
    category: 'Transactions',
    presets: [
      {
        label: 'Account Transactions',
        provider: 'atb',
        method: 'GET',
        path: `/fdx/5.3/accounts/${ATB_ACCOUNT_ID}/transactions`,
        query: '{\n  "limit": 100\n}',
      },
      {
        label: 'Account Transactions (page 2)',
        provider: 'atb',
        method: 'GET',
        path: `/fdx/5.3/accounts/${ATB_ACCOUNT_ID}/transactions`,
        query: '{\n  "limit": 100,\n  "offset": "100"\n}',
      },
    ],
  },
];

export const allnodesPresetsGrouped: PresetGroup[] = [
  {
    category: 'BTC',
    presets: [
      allnodesPreset('btc', 'getblockchaininfo', [], '1.0'),
      allnodesPreset('btc', 'getblockcount', [], '1.0'),
      allnodesPreset('btc', 'getbestblockhash', [], '1.0'),
      allnodesPreset('btc', 'getblockhash', [0], '1.0'),
      allnodesPreset('btc', 'getblock', ['{btcBlockHash}', 1], '1.0'),
      allnodesPreset('btc', 'getrawtransaction', ['{btcTxid}', true], '1.0'),
      allnodesPreset(
        'btc',
        'getbalance',
        [],
        '1.0',
        '/btc/wallet/{walletName}',
      ),
      allnodesPreset(
        'btc',
        'getbalances',
        [],
        '1.0',
        '/btc/wallet/{walletName}',
      ),
      allnodesPreset(
        'btc',
        'getwalletinfo',
        [],
        '1.0',
        '/btc/wallet/{walletName}',
      ),
      allnodesPreset(
        'btc',
        'listunspent',
        [],
        '1.0',
        '/btc/wallet/{walletName}',
      ),
    ],
  },
  { category: 'ETH', presets: evmChainPresets('eth') },
  { category: 'ETH archive', presets: evmChainPresets('eth-archive') },
  { category: 'BASE', presets: evmChainPresets('base') },
  { category: 'BASE archive', presets: evmChainPresets('base-archive') },
  { category: 'TEMPO', presets: evmChainPresets('tempo') },
  { category: 'BaseSepolia', presets: evmChainPresets('basesepolia') },
  { category: 'ETHSepolia', presets: evmChainPresets('ethsepolia') },
];

// Flatten grouped presets for backward compatibility
export const allPresets: Preset[] = [
  ...fireblockPresetsGrouped.flatMap((g) => g.presets),
  ...alliumPresetsGrouped.flatMap((g) => g.presets),
  ...coinapiPresetsGrouped.flatMap((g) => g.presets),
  ...bitgoPresetsGrouped.flatMap((g) => g.presets),
  ...atbPresetsGrouped.flatMap((g) => g.presets),
  ...allnodesPresetsGrouped.flatMap((g) => g.presets),
];

// Grouped presets by provider
export const presetsGroupedByProvider: Record<ProviderId, PresetGroup[]> = {
  fireblocks: fireblockPresetsGrouped,
  allium: alliumPresetsGrouped,
  coinapi: coinapiPresetsGrouped,
  bitgo: bitgoPresetsGrouped,
  atb: atbPresetsGrouped,
  allnodes: allnodesPresetsGrouped,
};
