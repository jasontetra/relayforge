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
  | 'allnodes'
  | 'ledger'
  | 'anchorage'
  | 'coinbase';

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

const LEDGER_ACCOUNT_ID = '{accountId}';
const LEDGER_ENTITY_ID = '{entityId}';
const LEDGER_TX_ID = '{txId}';
const LEDGER_BTC_ACCOUNT_ID = 1003;
const LEDGER_SOL_ACCOUNT_ID = 1004;
const LEDGER_ERC20_ACCOUNT_ID = 1005;
const LEDGER_USDC_CONTRACT =
  'USDCsyn11111111111111111111111111111111111';

export const ledgerPresetsGrouped: PresetGroup[] = [
  {
    category: 'Accounts',
    presets: [
      {
        label: 'List Accounts',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
      },
      {
        label: 'Get Account',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}`,
      },
      {
        label: 'Get Account Currency',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}/currency`,
      },
      {
        label: 'Get Account Balances',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}/balances`,
      },
      {
        label: 'Get Account Balances History',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}/balances/history`,
      },
      {
        label: 'Get ERC-20 Children',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}/erc20-children-accounts`,
      },
      {
        label: 'Get Account Tokens',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ACCOUNT_ID}/tokens`,
      },
      {
        label: 'Get Solana Account Tokens',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_SOL_ACCOUNT_ID}/tokens`,
      },
      {
        label: 'Get Bitcoin Account',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_BTC_ACCOUNT_ID}`,
      },
      {
        label: 'Get Solana Account',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_SOL_ACCOUNT_ID}`,
      },
      {
        label: 'Get ERC-20 Account',
        provider: 'ledger',
        method: 'GET',
        path: `/accounts/${LEDGER_ERC20_ACCOUNT_ID}`,
      },
      {
        label: 'Search Account by Id',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: `{\n  "id": "${LEDGER_ACCOUNT_ID}"\n}`,
      },
      {
        label: 'Search Accounts by Currency',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: '{\n  "currency": "solana"\n}',
      },
      {
        label: 'Search Accounts by Entity',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: `{\n  "entity": "${LEDGER_ENTITY_ID}"\n}`,
      },
      {
        label: 'Search Accounts by Status',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: '{\n  "status": "ACTIVE"\n}',
      },
      {
        label: 'Search Accounts by Name',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: '{\n  "name": "tledger-test-account-eth-01"\n}',
      },
      {
        label: 'Search Accounts by Type Erc20',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: '{\n  "account_type": "Erc20"\n}',
      },
      {
        label: 'Search Accounts by Parent',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: `{\n  "parent": "${LEDGER_ACCOUNT_ID}"\n}`,
      },
      {
        label: 'List Accounts Page 1',
        provider: 'ledger',
        method: 'GET',
        path: '/accounts',
        query: '{\n  "page": 1,\n  "page_size": 2\n}',
      },
    ],
  },
  {
    category: 'Entities',
    presets: [
      {
        label: 'Get Entity',
        provider: 'ledger',
        method: 'GET',
        path: `/entities/${LEDGER_ENTITY_ID}`,
      },
      {
        label: 'Search Entities by Account',
        provider: 'ledger',
        method: 'GET',
        path: '/entities',
        query: `{\n  "account": "${LEDGER_ACCOUNT_ID}"\n}`,
      },
    ],
  },
  {
    category: 'Transactions',
    presets: [
      {
        label: 'List Account Transactions',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "account": "${LEDGER_ACCOUNT_ID}"\n}`,
      },
      {
        label: 'Search Transactions by Status',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: '{\n  "status": "CONFIRMED"\n}',
      },
      {
        label: 'Search Account Transactions by Status',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "account": "${LEDGER_ACCOUNT_ID}",\n  "status": "CONFIRMED"\n}`,
      },
      {
        label: 'Search Transactions by Type',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: '{\n  "type": "SEND"\n}',
      },
      {
        label: 'Search Transactions by Hash',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "tx_hash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n}`,
      },
      {
        label: 'List Transactions Page 1',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: '{\n  "page": 1,\n  "page_size": 2\n}',
      },
      {
        label: 'Search Transactions Created After',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: '{\n  "created_after": "2026-06-25T00:00:00.000Z"\n}',
      },
      {
        label: 'Get Transaction',
        provider: 'ledger',
        method: 'GET',
        path: `/transactions/${LEDGER_TX_ID}`,
      },
      {
        label: 'List Solana Transactions',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "account": "${LEDGER_SOL_ACCOUNT_ID}"\n}`,
      },
      {
        label: 'Get Solana Stake Transaction',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions/4009',
      },
      {
        label: 'Get SPL Token Transfer',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions/4010',
      },
      {
        label: 'List ERC-20 Transactions',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "account": "${LEDGER_ERC20_ACCOUNT_ID}"\n}`,
      },
      {
        label: 'List SPL Token Transactions',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions',
        query: `{\n  "account": "${LEDGER_SOL_ACCOUNT_ID}",\n  "type": "SEND_SPL_TOKEN_CHECKED"\n}`,
      },
      {
        label: 'Get ERC-20 Transfer',
        provider: 'ledger',
        method: 'GET',
        path: '/transactions/4011',
      },
    ],
  },
  {
    category: 'Currencies',
    presets: [
      {
        label: 'List Currencies',
        provider: 'ledger',
        method: 'GET',
        path: '/currencies',
      },
      {
        label: 'List Tokens',
        provider: 'ledger',
        method: 'GET',
        path: '/currencies/tokens',
      },
      {
        label: 'Get Currency',
        provider: 'ledger',
        method: 'GET',
        path: '/currencies/ethereum',
      },
      {
        label: 'Get Solana Token',
        provider: 'ledger',
        method: 'GET',
        path: `/currencies/solana/tokens/${LEDGER_USDC_CONTRACT}`,
      },
      {
        label: 'Get Ethereum Token',
        provider: 'ledger',
        method: 'GET',
        path: '/currencies/ethereum/tokens/0x000000000000000000000000000000000000c0de',
      },
    ],
  },
  {
    category: 'Notifications',
    presets: [
      {
        label: 'Notification Configuration',
        provider: 'ledger',
        method: 'GET',
        path: '/notifications/configuration',
      },
    ],
  },
];

const ANCHORAGE_VAULT_ID = '{vaultId}';
const ANCHORAGE_WALLET_ID = '{walletId}';
const ANCHORAGE_TX_ID = '{transactionId}';
const ANCHORAGE_VAULT_2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const ANCHORAGE_WALLET_BTC = '22222222222222222222222222222222';
const ANCHORAGE_WALLET_EMPTY = '33333333333333333333333333333333';
const ANCHORAGE_WALLET_ARCHIVED = '44444444444444444444444444444444';
const ANCHORAGE_WALLET_SOL = '55555555555555555555555555555555';
const ANCHORAGE_TX_ETH_WITHDRAW = 'bbbb0001000000000000000000000001';
const ANCHORAGE_TX_BTC = 'cccc0001000000000000000000000001';
const ANCHORAGE_TX_SOL = 'eeee0001000000000000000000000001';
const ANCHORAGE_TX_USDC_SOL = 'ffff0001000000000000000000000001';
const ANCHORAGE_TX_PARTIAL = '550e8400e29b41d4a716446655440001';

export const anchoragePresetsGrouped: PresetGroup[] = [
  {
    category: 'Asset types',
    presets: [
      {
        label: 'List Asset Types',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/asset-types',
      },
      {
        label: 'Filter Asset Types ETHSEP',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/asset-types',
        query: '{\n  "assetTypes": "ETHSEP"\n}',
      },
    ],
  },
  {
    category: 'Vaults',
    presets: [
      {
        label: 'List Vaults',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/vaults',
      },
      {
        label: 'Get Vault',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/vaults/${ANCHORAGE_VAULT_ID}`,
      },
      {
        label: 'Get Bitcoin/Solana Vault',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/vaults/${ANCHORAGE_VAULT_2}`,
      },
      {
        label: 'List Vaults After Vault 2',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/vaults',
        query: `{\n  "afterId": "${ANCHORAGE_VAULT_2}"\n}`,
      },
    ],
  },
  {
    category: 'Wallets',
    presets: [
      {
        label: 'List Vault Wallets',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/vaults/${ANCHORAGE_VAULT_ID}/wallets`,
      },
      {
        label: 'List Vault Wallets Page 2',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/vaults/${ANCHORAGE_VAULT_ID}/wallets`,
        query: `{\n  "afterId": "${ANCHORAGE_WALLET_EMPTY}"\n}`,
      },
      {
        label: 'List Vault 2 Wallets',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/vaults/${ANCHORAGE_VAULT_2}/wallets`,
      },
      {
        label: 'Get Wallet',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/wallets/${ANCHORAGE_WALLET_ID}`,
      },
      {
        label: 'Get Bitcoin Wallet',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/wallets/${ANCHORAGE_WALLET_BTC}`,
      },
      {
        label: 'Get Empty Wallet',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/wallets/${ANCHORAGE_WALLET_EMPTY}`,
      },
      {
        label: 'Get Archived Wallet',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/wallets/${ANCHORAGE_WALLET_ARCHIVED}`,
      },
      {
        label: 'Get Solana Wallet',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/wallets/${ANCHORAGE_WALLET_SOL}`,
      },
    ],
  },
  {
    category: 'Transactions',
    presets: [
      {
        label: 'List All Transactions',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/transactions',
      },
      {
        label: 'List Vault Transactions',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/transactions',
        query: `{\n  "vaultId": "${ANCHORAGE_VAULT_ID}"\n}`,
      },
      {
        label: 'List Vault 2 Transactions',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/transactions',
        query: `{\n  "vaultId": "${ANCHORAGE_VAULT_2}"\n}`,
      },
      {
        label: 'List Wallet Transactions',
        provider: 'anchorage',
        method: 'GET',
        path: '/v2/transactions',
        query: `{\n  "walletId": "${ANCHORAGE_WALLET_ID}"\n}`,
      },
      {
        label: 'Get Transaction',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_ID}`,
      },
      {
        label: 'Get ETHSEP Withdrawal',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_ETH_WITHDRAW}`,
      },
      {
        label: 'Get Bitcoin Deposit',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_BTC}`,
      },
      {
        label: 'Get Solana Deposit',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_SOL}`,
      },
      {
        label: 'Get USDC_SOL Transfer',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_USDC_SOL}`,
      },
      {
        label: 'Get Partial Transaction',
        provider: 'anchorage',
        method: 'GET',
        path: `/v2/transactions/${ANCHORAGE_TX_PARTIAL}`,
      },
    ],
  },
];

const CB_PORTFOLIO = '{portfolioId}';
const CB_ENTITY = '{entityId}';
const CB_WALLET = '{walletId}';
const CB_TX = '{transactionId}';
const CB_WALLET_BTC = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbb0002';
const CB_TX_WITHDRAW = 'dddddddd-dddd-4ddd-8ddd-dddddddd0002';

export const coinbasePresetsGrouped: PresetGroup[] = [
  {
    category: 'Portfolio',
    presets: [
      {
        label: 'List Portfolios',
        provider: 'coinbase',
        method: 'GET',
        path: '/v1/portfolios',
      },
      {
        label: 'Get Portfolio',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}`,
      },
    ],
  },
  {
    category: 'Wallets',
    presets: [
      {
        label: 'List Wallets',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets`,
      },
      {
        label: 'List Wallets Page 2',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets`,
        query: '{\n  "cursor": "cb-wallets-2"\n}',
      },
      {
        label: 'List ETH Wallets',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets`,
        query: '{\n  "symbols": "ETH"\n}',
      },
      {
        label: 'Get Wallet',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets/${CB_WALLET}`,
      },
      {
        label: 'Get Wallet Balance',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets/${CB_WALLET}/balance`,
      },
      {
        label: 'List Wallet Addresses',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets/${CB_WALLET}/addresses`,
      },
    ],
  },
  {
    category: 'Transactions',
    presets: [
      {
        label: 'List Transactions',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/transactions`,
        query:
          '{\n  "start_time": "2026-06-24T00:00:00.000Z",\n  "end_time": "2026-06-25T00:00:00.000Z"\n}',
      },
      {
        label: 'List Transactions Page 2',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/transactions`,
        query: '{\n  "cursor": "cb-tx-2"\n}',
      },
      {
        label: 'Get Transaction',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/transactions/${CB_TX}`,
      },
      {
        label: 'Get BTC Withdrawal',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/transactions/${CB_TX_WITHDRAW}`,
      },
      {
        label: 'List Wallet Transactions',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets/${CB_WALLET}/transactions`,
      },
      {
        label: 'List BTC Wallet Transactions',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/wallets/${CB_WALLET_BTC}/transactions`,
      },
    ],
  },
  {
    category: 'Activity',
    presets: [
      {
        label: 'List Portfolio Users',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/users`,
      },
      {
        label: 'List Entity Users',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/entities/${CB_ENTITY}/users`,
      },
      {
        label: 'List Entity Assets',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/entities/${CB_ENTITY}/assets`,
      },
      {
        label: 'List Orders',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/orders`,
        query:
          '{\n  "start_date": "2026-06-24T00:00:00.000Z",\n  "end_date": "2026-06-25T00:00:00.000Z"\n}',
      },
      {
        label: 'List Activities',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/activities`,
        query:
          '{\n  "start_time": "2026-06-24T00:00:00.000Z",\n  "end_time": "2026-06-25T00:00:00.000Z"\n}',
      },
      {
        label: 'List Address Book',
        provider: 'coinbase',
        method: 'GET',
        path: `/v1/portfolios/${CB_PORTFOLIO}/address_book`,
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
  ...atbPresetsGrouped.flatMap((g) => g.presets),
  ...allnodesPresetsGrouped.flatMap((g) => g.presets),
  ...ledgerPresetsGrouped.flatMap((g) => g.presets),
  ...anchoragePresetsGrouped.flatMap((g) => g.presets),
  ...coinbasePresetsGrouped.flatMap((g) => g.presets),
];

// Grouped presets by provider
export const presetsGroupedByProvider: Record<ProviderId, PresetGroup[]> = {
  fireblocks: fireblockPresetsGrouped,
  allium: alliumPresetsGrouped,
  coinapi: coinapiPresetsGrouped,
  bitgo: bitgoPresetsGrouped,
  atb: atbPresetsGrouped,
  allnodes: allnodesPresetsGrouped,
  ledger: ledgerPresetsGrouped,
  anchorage: anchoragePresetsGrouped,
  coinbase: coinbasePresetsGrouped,
};
