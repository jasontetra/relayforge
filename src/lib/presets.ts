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
    category: 'Address & Transactions',
    presets: [
      {
        label: 'Get Address',
        provider: 'allium',
        method: 'GET',
        path: '/v1/address/{address}',
        query: '{\n  "chain": "ethereum"\n}',
      },
      {
        label: 'List Transactions',
        provider: 'allium',
        method: 'GET',
        path: '/v1/transactions',
        query: '{\n  "chain": "ethereum",\n  "limit": 10\n}',
      },
    ],
  },
];

export const coinapiPresetsGrouped: PresetGroup[] = [
  {
    category: 'Exchange Rates & Assets',
    presets: [
      {
        label: 'Get Exchange Rate',
        provider: 'coinapi',
        method: 'GET',
        path: '/v1/exchangerate/BTC/USD',
      },
      {
        label: 'List Assets',
        provider: 'coinapi',
        method: 'GET',
        path: '/v1/assets',
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
