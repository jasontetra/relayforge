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

export const bitgoPresetsGrouped: PresetGroup[] = [
  {
    category: 'Wallets',
    presets: [
      {
        label: 'Get Wallet Balance',
        provider: 'bitgo',
        method: 'GET',
        path: '/v2/btc/wallet/{walletId}',
      },
      {
        label: 'List Wallets',
        provider: 'bitgo',
        method: 'GET',
        path: '/v2/wallets',
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
