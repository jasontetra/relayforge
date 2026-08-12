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

export type ProviderId = 'fireblocks' | 'allium' | 'coinapi' | 'bitgo';

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
      {
        label: 'Send Coins',
        provider: 'bitgo',
        method: 'POST',
        path: `/api/v2/${MOCK_COIN}/wallet/${MOCK_WALLET_ID}/sendcoins`,
        body: '{\n  "address": "0x0000000000000000000000000000000000000002",\n  "amount": "10000",\n  "walletPassphrase": "test-passphrase"\n}',
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

// Flatten grouped presets for backward compatibility
export const allPresets: Preset[] = [
  ...fireblockPresetsGrouped.flatMap((g) => g.presets),
  ...alliumPresetsGrouped.flatMap((g) => g.presets),
  ...coinapiPresetsGrouped.flatMap((g) => g.presets),
  ...bitgoPresetsGrouped.flatMap((g) => g.presets),
];

// Grouped presets by provider
export const presetsGroupedByProvider: Record<ProviderId, PresetGroup[]> = {
  fireblocks: fireblockPresetsGrouped,
  allium: alliumPresetsGrouped,
  coinapi: coinapiPresetsGrouped,
  bitgo: bitgoPresetsGrouped,
};
