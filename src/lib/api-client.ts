import { execFile } from 'node:child_process';
import { createHash, createPrivateKey, randomUUID, type KeyObject } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { SignJWT } from 'jose';

const execFileAsync = promisify(execFile);

const DEFAULT_FIREBLOCKS_BASE_URL = 'https://api.fireblocks.io/v1';
const DEFAULT_ALLIUM_BASE_URL = 'https://api.allium.so';
const DEFAULT_COINAPI_BASE_URL = 'https://rest.coinapi.io';
const DEFAULT_BITGO_BASE_URL = 'https://app.bitgo.com';
const DEFAULT_LEDGER_BASE_URL = 'https://api.vault.ledger.com';
const DEFAULT_ANCHORAGE_BASE_URL = 'https://api.anchorage-staging.com';
const ANCHORAGE_VAULT_PLACEHOLDER = '{vaultId}';
const ANCHORAGE_WALLET_PLACEHOLDER = '{walletId}';
const ANCHORAGE_TX_PLACEHOLDER = '{transactionId}';
const DEFAULT_ANCHORAGE_MOCK_VAULT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const DEFAULT_ANCHORAGE_MOCK_WALLET_ID = '11111111111111111111111111111111';
const DEFAULT_ANCHORAGE_MOCK_TX_ID = 'aaaa0001000000000000000000000001';
const LEDGER_AUTH_RENEW_BEFORE_MS = 60 * 1000;
const LEDGER_ACCOUNT_PLACEHOLDER = '{accountId}';
const LEDGER_ENTITY_PLACEHOLDER = '{entityId}';
const LEDGER_TX_PLACEHOLDER = '{txId}';
const LEDGER_REQUEST_PLACEHOLDER = '{requestId}';
const DEFAULT_LEDGER_MOCK_ACCOUNT_ID = '1001';
const DEFAULT_LEDGER_MOCK_ENTITY_ID = '2001';
const DEFAULT_LEDGER_MOCK_TX_ID = '4001';
const DEFAULT_LEDGER_MOCK_REQUEST_ID = '5001';
const DEFAULT_ATB_BASE_URL = 'https://preprod.api.atb.com';
const DEFAULT_ATB_AUTH_URL = 'https://preprod.api.atb.com';
const DEFAULT_ATB_MOCK_ACCOUNT_ID = 'syn-acct-0001';
const DEFAULT_MOCKOON_BASE_URL = 'http://127.0.0.1:8080';
const DEFAULT_BITGO_MOCK_ENTERPRISE_ID = '5a7a5c5c5c5c5c5c5c5c5c5c';
const BITGO_ENTERPRISE_PLACEHOLDER = '{enterpriseId}';
const ATB_ACCOUNT_PLACEHOLDER = '{accountId}';
const ATB_ASSERTION_TYPE =
  'urn:ietf:params:oauth:client-assertion-type:jwt_bearer';
const ATB_ASSERTION_AUDIENCE = 'https://api.atb.com/';
const ATB_ASSERTION_LIFETIME_MS = 5 * 60 * 1000;
const ATB_AUTH_RENEW_BEFORE_MS = 60 * 1000;

export const ALLNODES_CHAINS = [
  'btc',
  'eth',
  'eth-archive',
  'base',
  'base-archive',
  'tempo',
  'basesepolia',
  'ethsepolia',
] as const;
export type AllnodesChain = (typeof ALLNODES_CHAINS)[number];

const ALLNODES_CHAIN_ALIASES: Record<string, AllnodesChain> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  'ethereum-archive': 'eth-archive',
  'base-sepolia': 'basesepolia',
  'eth-sepolia': 'ethsepolia',
};

const ALLNODES_TX_PLACEHOLDER = '{txHash}';
const ALLNODES_BLOCK_PLACEHOLDER = '{blockHash}';
const ALLNODES_BTC_BLOCK_PLACEHOLDER = '{btcBlockHash}';
const ALLNODES_BTC_TX_PLACEHOLDER = '{btcTxid}';
const ALLNODES_BTC_WALLET_PLACEHOLDER = '{walletName}';
const ALLNODES_BTC_WALLET_METHODS = new Set([
  'getbalance',
  'getbalances',
  'getwalletinfo',
  'listunspent',
]);
const SYNTHETIC_ALLNODES_TX_HASH =
  '0x1111111111111111111111111111111111111111111111111111111111111111';
const SYNTHETIC_ALLNODES_BLOCK_HASH =
  '0x2222222222222222222222222222222222222222222222222222222222222222';
const SYNTHETIC_ALLNODES_BTC_BLOCK_HASH =
  '2222222222222222222222222222222222222222222222222222222222222222';
const SYNTHETIC_ALLNODES_BTC_TXID =
  '3333333333333333333333333333333333333333333333333333333333333333';
const DEFAULT_ALLNODES_MOCK_BTC_WALLET = 'syn-wallet-0001';

const ALLNODES_RPC_URL_ENV: Record<AllnodesChain, string> = {
  btc: 'ALLNODES_BTC_RPC_URL',
  eth: 'ALLNODES_ETH_RPC_URL',
  'eth-archive': 'ALLNODES_ETH_ARCHIVE_RPC_URL',
  base: 'ALLNODES_BASE_RPC_URL',
  'base-archive': 'ALLNODES_BASE_ARCHIVE_RPC_URL',
  tempo: 'ALLNODES_TEMPO_RPC_URL',
  basesepolia: 'ALLNODES_BASESEPOLIA_RPC_URL',
  ethsepolia: 'ALLNODES_ETHSEPOLIA_RPC_URL',
};

const DEFAULT_ALLNODES_RPC_URL: Record<AllnodesChain, string> = {
  btc: 'https://bitcoin-rpc.publicnode.com',
  eth: 'https://ethereum-rpc.publicnode.com',
  'eth-archive': 'https://ethereum-rpc.publicnode.com',
  base: 'https://base-rpc.publicnode.com',
  'base-archive': 'https://base-rpc.publicnode.com',
  tempo: 'https://tempo-rpc.publicnode.com',
  basesepolia: 'https://base-sepolia-rpc.publicnode.com',
  ethsepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
};

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ProviderId =
  | 'fireblocks'
  | 'allium'
  | 'coinapi'
  | 'bitgo'
  | 'atb'
  | 'allnodes'
  | 'ledger'
  | 'anchorage';
export type ServerTarget = 'real' | 'mockoon' | 'both';
export type ForwardTarget = Exclude<ServerTarget, 'both'>;

export type ApiRequestInput = {
  provider: ProviderId;
  method: RequestMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  target?: ForwardTarget;
};

// Each provider mock listens on its own port, so MOCKOON_BASE_URL only acts as
// the shared fallback.
const MOCKOON_BASE_URL_ENV: Record<ProviderId, string> = {
  fireblocks: 'FIREBLOCKS_MOCKOON_BASE_URL',
  allium: 'ALLIUM_MOCKOON_BASE_URL',
  coinapi: 'COINAPI_MOCKOON_BASE_URL',
  bitgo: 'BITGO_MOCKOON_BASE_URL',
  atb: 'ATB_MOCKOON_BASE_URL',
  allnodes: 'ALLNODES_MOCKOON_BASE_URL',
  ledger: 'LEDGER_MOCKOON_BASE_URL',
  anchorage: 'ANCHORAGE_MOCKOON_BASE_URL',
};

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getEnvAny(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing required environment variable: ${names.join(' or ')}`,
  );
}

function getBitgoEnterpriseId(target: ForwardTarget): string {
  if (target === 'mockoon') {
    return (
      process.env.BITGO_MOCK_ENTERPRISE_ID?.trim() ||
      DEFAULT_BITGO_MOCK_ENTERPRISE_ID
    );
  }

  return getEnv('BITGO_ENTERPRISE_ID');
}

// BitGo presets ship with {enterpriseId} so one request works against both
// targets, which recognize different enterprises. Resolved server-side, and only
// when the placeholder is actually used, so other presets stay usable without
// BITGO_ENTERPRISE_ID.
function resolveBitgoEnterprise(
  path: string,
  query: ApiRequestInput['query'],
  target: ForwardTarget,
): { path: string; query: ApiRequestInput['query'] } {
  const queryEntries = Object.entries(query ?? {});
  const inPath = path.includes(BITGO_ENTERPRISE_PLACEHOLDER);
  const inQuery = queryEntries.some(
    ([, value]) =>
      typeof value === 'string' &&
      value.includes(BITGO_ENTERPRISE_PLACEHOLDER),
  );

  if (!inPath && !inQuery) {
    return { path, query };
  }

  const enterpriseId = getBitgoEnterpriseId(target);

  return {
    path: path.replaceAll(BITGO_ENTERPRISE_PLACEHOLDER, enterpriseId),
    query: inQuery
      ? Object.fromEntries(
          queryEntries.map(([key, value]) => [
            key,
            typeof value === 'string'
              ? value.replaceAll(BITGO_ENTERPRISE_PLACEHOLDER, enterpriseId)
              : value,
          ]),
        )
      : query,
  };
}

function getAtbAccountId(target: ForwardTarget): string {
  if (target === 'mockoon') {
    return (
      process.env.ATB_MOCK_ACCOUNT_ID?.trim() || DEFAULT_ATB_MOCK_ACCOUNT_ID
    );
  }

  return getEnv('ATB_ACCOUNT_ID');
}

function resolveAtbAccount(
  path: string,
  query: ApiRequestInput['query'],
  target: ForwardTarget,
): { path: string; query: ApiRequestInput['query'] } {
  const queryEntries = Object.entries(query ?? {});
  const inPath = path.includes(ATB_ACCOUNT_PLACEHOLDER);
  const inQuery = queryEntries.some(
    ([, value]) =>
      typeof value === 'string' && value.includes(ATB_ACCOUNT_PLACEHOLDER),
  );

  if (!inPath && !inQuery) {
    return { path, query };
  }

  const accountId = getAtbAccountId(target);

  return {
    path: path.replaceAll(ATB_ACCOUNT_PLACEHOLDER, accountId),
    query: inQuery
      ? Object.fromEntries(
          queryEntries.map(([key, value]) => [
            key,
            typeof value === 'string'
              ? value.replaceAll(ATB_ACCOUNT_PLACEHOLDER, accountId)
              : value,
          ]),
        )
      : query,
  };
}

function isAllnodesChain(value: string): value is AllnodesChain {
  return (ALLNODES_CHAINS as readonly string[]).includes(value);
}

function parseAllnodesPath(
  path: string,
  query: ApiRequestInput['query'],
): { chain: AllnodesChain; rpcSuffix: string } {
  const segments = normalizePath(path)
    .slice(1)
    .split('/')
    .filter(Boolean);
  const fromQuery =
    typeof query?.chain === 'string' ? query.chain.trim().toLowerCase() : '';
  const raw = (segments[0] || fromQuery).toLowerCase();
  const chain = ALLNODES_CHAIN_ALIASES[raw] ?? raw;

  if (!isAllnodesChain(chain)) {
    throw new Error(
      'Allnodes path must be one of /btc, /eth, /eth-archive, /base, /base-archive, /tempo, /basesepolia, /ethsepolia.',
    );
  }

  const rpcSuffix = segments.length > 1 ? `/${segments.slice(1).join('/')}` : '';
  return { chain, rpcSuffix };
}

function getAllnodesRpcUrl(chain: AllnodesChain): string {
  return (
    process.env[ALLNODES_RPC_URL_ENV[chain]]?.trim() ||
    DEFAULT_ALLNODES_RPC_URL[chain]
  );
}

function stripUrlUserInfo(url: URL): { href: string; authorization?: string } {
  if (!url.username && !url.password) {
    return { href: url.href };
  }

  const user = decodeURIComponent(url.username);
  const pass = decodeURIComponent(url.password);
  const authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  url.username = '';
  url.password = '';
  return { href: url.href, authorization };
}

function applyPlaceholders(
  value: unknown,
  vars: Record<string, string>,
): unknown {
  if (typeof value === 'string') {
    let out = value;
    for (const [key, replacement] of Object.entries(vars)) {
      out = out.replaceAll(`{${key}}`, replacement);
    }
    return out;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyPlaceholders(item, vars));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        applyPlaceholders(nested, vars),
      ]),
    );
  }

  return value;
}

function placeholderNeeded(haystack: string, token: string): boolean {
  return haystack.includes(token);
}

async function allnodesJsonRpc(
  href: string,
  authorization: string | undefined,
  methodName: string,
  params: unknown[],
  jsonrpc: '1.0' | '2.0',
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authorization) {
    headers.Authorization = authorization;
  }

  const response = await fetch(href, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc, id: 1, method: methodName, params }),
    cache: 'no-store',
  });
  const text = await response.text();
  let parsed: { result?: unknown; error?: { message?: string } };
  try {
    parsed = JSON.parse(text) as {
      result?: unknown;
      error?: { message?: string };
    };
  } catch {
    throw new Error(
      `Allnodes ${methodName} returned non-JSON (${response.status}).`,
    );
  }
  if (parsed.error) {
    throw new Error(
      `Allnodes ${methodName} failed: ${parsed.error.message || 'unknown error'}`,
    );
  }
  return parsed.result;
}

function jsonRpcMethodName(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return undefined;
  }
  const method = (body as { method?: unknown }).method;
  return typeof method === 'string' ? method : undefined;
}

function firstTxHash(transactions: unknown[] | undefined): string | undefined {
  const tx = transactions?.[0];
  if (typeof tx === 'string') {
    return tx;
  }
  if (tx && typeof tx === 'object' && 'hash' in tx) {
    const hash = (tx as { hash?: unknown }).hash;
    if (typeof hash === 'string') {
      return hash;
    }
  }
  return undefined;
}

function joinRpcPath(href: string, rpcSuffix: string): string {
  if (!rpcSuffix) {
    return href;
  }
  const url = new URL(href);
  const basePath = url.pathname.replace(/\/+$/, '');
  url.pathname = `${basePath}${rpcSuffix.startsWith('/') ? rpcSuffix : `/${rpcSuffix}`}`;
  return url.href;
}

function joinMockoonUrl(base: string, path: string): URL {
  return new URL(joinRpcPath(base, path.startsWith('/') ? path : `/${path}`));
}

async function resolveAllnodesLiveValues(
  chain: AllnodesChain,
  href: string,
  authorization: string | undefined,
  haystack: string,
): Promise<Record<string, string>> {
  const vars: Record<string, string> = {};

  if (chain === 'btc') {
    if (placeholderNeeded(haystack, ALLNODES_BTC_WALLET_PLACEHOLDER)) {
      const walletName = process.env.ALLNODES_BTC_WALLET?.trim();
      if (!walletName) {
        throw new Error(
          'Set ALLNODES_BTC_WALLET for BTC wallet RPCs (path /btc/wallet/{walletName}).',
        );
      }
      vars.walletName = walletName;
    }

    const needBlock = placeholderNeeded(haystack, ALLNODES_BTC_BLOCK_PLACEHOLDER);
    const needTx = placeholderNeeded(haystack, ALLNODES_BTC_TX_PLACEHOLDER);
    if (needBlock || needTx) {
      const best = await allnodesJsonRpc(
        href,
        authorization,
        'getbestblockhash',
        [],
        '1.0',
      );
      if (typeof best !== 'string') {
        throw new Error('Allnodes getbestblockhash did not return a hash.');
      }
      vars.btcBlockHash = best;
      if (needTx) {
        const block = (await allnodesJsonRpc(
          href,
          authorization,
          'getblock',
          [best, 1],
          '1.0',
        )) as { tx?: unknown };
        const txid = Array.isArray(block?.tx) ? block.tx[0] : undefined;
        if (typeof txid !== 'string') {
          throw new Error('Allnodes tip block has no txid to substitute.');
        }
        vars.btcTxid = txid;
      }
    }
    return vars;
  }

  const needBlock = placeholderNeeded(haystack, ALLNODES_BLOCK_PLACEHOLDER);
  const needTx = placeholderNeeded(haystack, ALLNODES_TX_PLACEHOLDER);
  if (!needBlock && !needTx) {
    return vars;
  }

  const heightHex = await allnodesJsonRpc(
    href,
    authorization,
    'eth_blockNumber',
    [],
    '2.0',
  );
  if (typeof heightHex !== 'string') {
    throw new Error('Allnodes eth_blockNumber did not return a block number.');
  }
  const height = Number.parseInt(heightHex, 16);
  if (!Number.isFinite(height) || height < 0) {
    throw new Error('Allnodes eth_blockNumber was not a valid height.');
  }
  for (let offset = 0; offset < 40; offset += 1) {
    const block = (await allnodesJsonRpc(
      href,
      authorization,
      'eth_getBlockByNumber',
      [`0x${(height - offset).toString(16)}`, false],
      '2.0',
    )) as { hash?: string; transactions?: unknown[] } | null;
    if (!block) {
      continue;
    }
    if (needBlock && typeof block.hash === 'string') {
      vars.blockHash = block.hash;
    }
    const txHash = firstTxHash(block.transactions);
    if (needTx && txHash) {
      vars.txHash = txHash;
      if (!vars.blockHash && typeof block.hash === 'string') {
        vars.blockHash = block.hash;
      }
      break;
    }
    if (needBlock && vars.blockHash && !needTx) {
      break;
    }
  }

  if (needBlock && !vars.blockHash) {
    throw new Error('Could not resolve {blockHash} from recent Allnodes blocks.');
  }
  if (needTx && !vars.txHash) {
    throw new Error('Could not resolve {txHash} from recent Allnodes blocks.');
  }
  return vars;
}

function syntheticAllnodesValues(): Record<string, string> {
  return {
    txHash: SYNTHETIC_ALLNODES_TX_HASH,
    blockHash: SYNTHETIC_ALLNODES_BLOCK_HASH,
    btcBlockHash: SYNTHETIC_ALLNODES_BTC_BLOCK_HASH,
    btcTxid: SYNTHETIC_ALLNODES_BTC_TXID,
    walletName:
      process.env.ALLNODES_MOCK_BTC_WALLET?.trim() ||
      DEFAULT_ALLNODES_MOCK_BTC_WALLET,
  };
}

function ledgerPlaceholderValue(
  target: ForwardTarget,
  realEnv: string,
  mockEnv: string,
  mockDefault: string,
): string {
  if (target === 'mockoon') {
    return process.env[mockEnv]?.trim() || mockDefault;
  }
  return getEnv(realEnv);
}

function resolveLedgerIds(
  path: string,
  query: ApiRequestInput['query'],
  target: ForwardTarget,
): { path: string; query: ApiRequestInput['query'] } {
  const haystack = `${path}\n${JSON.stringify(query ?? {})}`;
  const vars: Record<string, string> = {};

  if (placeholderNeeded(haystack, LEDGER_ACCOUNT_PLACEHOLDER)) {
    vars.accountId = ledgerPlaceholderValue(
      target,
      'LEDGER_ACCOUNT_ID',
      'LEDGER_MOCK_ACCOUNT_ID',
      DEFAULT_LEDGER_MOCK_ACCOUNT_ID,
    );
  }
  if (placeholderNeeded(haystack, LEDGER_ENTITY_PLACEHOLDER)) {
    vars.entityId = ledgerPlaceholderValue(
      target,
      'LEDGER_ENTITY_ID',
      'LEDGER_MOCK_ENTITY_ID',
      DEFAULT_LEDGER_MOCK_ENTITY_ID,
    );
  }
  if (placeholderNeeded(haystack, LEDGER_TX_PLACEHOLDER)) {
    vars.txId = ledgerPlaceholderValue(
      target,
      'LEDGER_TX_ID',
      'LEDGER_MOCK_TX_ID',
      DEFAULT_LEDGER_MOCK_TX_ID,
    );
  }
  if (placeholderNeeded(haystack, LEDGER_REQUEST_PLACEHOLDER)) {
    vars.requestId = ledgerPlaceholderValue(
      target,
      'LEDGER_REQUEST_ID',
      'LEDGER_MOCK_REQUEST_ID',
      DEFAULT_LEDGER_MOCK_REQUEST_ID,
    );
  }

  if (Object.keys(vars).length === 0) {
    return { path, query };
  }

  return {
    path: String(applyPlaceholders(path, vars)),
    query: applyPlaceholders(query, vars) as ApiRequestInput['query'],
  };
}

function resolveAnchorageIds(
  path: string,
  query: ApiRequestInput['query'],
  target: ForwardTarget,
): { path: string; query: ApiRequestInput['query'] } {
  const haystack = `${path}\n${JSON.stringify(query ?? {})}`;
  const vars: Record<string, string> = {};

  if (placeholderNeeded(haystack, ANCHORAGE_VAULT_PLACEHOLDER)) {
    vars.vaultId = ledgerPlaceholderValue(
      target,
      'ANCHORAGE_VAULT_ID',
      'ANCHORAGE_MOCK_VAULT_ID',
      DEFAULT_ANCHORAGE_MOCK_VAULT_ID,
    );
  }
  if (placeholderNeeded(haystack, ANCHORAGE_WALLET_PLACEHOLDER)) {
    vars.walletId = ledgerPlaceholderValue(
      target,
      'ANCHORAGE_WALLET_ID',
      'ANCHORAGE_MOCK_WALLET_ID',
      DEFAULT_ANCHORAGE_MOCK_WALLET_ID,
    );
  }
  if (placeholderNeeded(haystack, ANCHORAGE_TX_PLACEHOLDER)) {
    vars.transactionId = ledgerPlaceholderValue(
      target,
      'ANCHORAGE_TX_ID',
      'ANCHORAGE_MOCK_TX_ID',
      DEFAULT_ANCHORAGE_MOCK_TX_ID,
    );
  }

  if (Object.keys(vars).length === 0) {
    return { path, query };
  }

  return {
    path: String(applyPlaceholders(path, vars)),
    query: applyPlaceholders(query, vars) as ApiRequestInput['query'],
  };
}

function resolveProviderPlaceholders(
  provider: ProviderId,
  path: string,
  query: ApiRequestInput['query'],
  target: ForwardTarget,
): { path: string; query: ApiRequestInput['query'] } {
  if (provider === 'bitgo') {
    return resolveBitgoEnterprise(normalizePath(path), query, target);
  }
  if (provider === 'atb') {
    return resolveAtbAccount(normalizePath(path), query, target);
  }
  if (provider === 'ledger') {
    return resolveLedgerIds(normalizePath(path), query, target);
  }
  if (provider === 'anchorage') {
    return resolveAnchorageIds(normalizePath(path), query, target);
  }
  return { path: normalizePath(path), query };
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

async function convertOpenSshPrivateKey(pem: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'relayforge-key-'));
  const file = join(dir, 'id_rsa');

  try {
    await writeFile(file, pem.endsWith('\n') ? pem : `${pem}\n`, {
      mode: 0o600,
    });
    await execFileAsync('ssh-keygen', [
      '-p',
      '-f',
      file,
      '-m',
      'pkcs8',
      '-N',
      '',
      '-P',
      '',
    ]);
    return (await readFile(file, 'utf8')).trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function keyParseError(cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : 'unsupported';
  return new Error(
    `ATB_PRIVATE_KEY could not be parsed (${detail}). Use PKCS#1 (BEGIN RSA PRIVATE KEY), PKCS#8 (BEGIN PRIVATE KEY), or an unencrypted OpenSSH RSA key.`,
  );
}

async function importPemPrivateKey(raw: string): Promise<KeyObject> {
  const pem = normalizePrivateKey(raw);

  try {
    return createPrivateKey(pem);
  } catch (error) {
    if (!pem.includes('BEGIN OPENSSH PRIVATE KEY')) {
      throw keyParseError(error);
    }
  }

  try {
    return createPrivateKey(await convertOpenSshPrivateKey(pem));
  } catch (error) {
    throw keyParseError(error);
  }
}

function normalizePath(path: string): string {
  const trimmed = path.trim();

  if (!trimmed) {
    throw new Error('Path is required.');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    throw new Error('Use an API path, not a full URL.');
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function serializeBody(body: unknown): string {
  if (body === undefined || body === null) {
    return '';
  }

  return JSON.stringify(body);
}

async function signJwt(path: string, body: unknown): Promise<string> {
  const apiKey = getEnv('FIREBLOCKS_API_KEY');
  const privateKey = createPrivateKey(
    normalizePrivateKey(getEnv('FIREBLOCKS_SECRET_KEY')),
  );
  const now = Math.floor(Date.now() / 1000);
  const bodyHash = createHash('sha256')
    .update(serializeBody(body))
    .digest('hex');

  return new SignJWT({
    uri: path,
    nonce: randomUUID(),
    iat: now,
    exp: now + 55,
    sub: apiKey,
    bodyHash,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
}

type AtbAuthState = {
  accessToken: string;
  clientAssertion: string;
  tokenExpiryMs: number;
  assertionExpiryMs: number;
};

let atbAuth: AtbAuthState | null = null;
let atbAuthInflight: Promise<AtbAuthState> | null = null;

function atbAuthStillValid(state: AtbAuthState, now = Date.now()): boolean {
  if (!state.accessToken || now >= state.tokenExpiryMs) {
    return false;
  }
  if (!state.clientAssertion) {
    return false;
  }
  return state.assertionExpiryMs > now + ATB_AUTH_RENEW_BEFORE_MS;
}

let atbSigningKey: KeyObject | null = null;

async function getAtbSigningKey(): Promise<KeyObject> {
  if (!atbSigningKey) {
    atbSigningKey = await importPemPrivateKey(getEnv('ATB_PRIVATE_KEY'));
  }
  return atbSigningKey;
}

async function signAtbClientAssertion(): Promise<string> {
  const clientId = getEnv('ATB_CLIENT_ID');
  const privateKey = await getAtbSigningKey();

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientId)
    .setSubject(clientId)
    .setAudience(ATB_ASSERTION_AUDIENCE)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + ATB_ASSERTION_LIFETIME_MS / 1000)
    .sign(privateKey);
}

async function refreshAtbAuth(): Promise<AtbAuthState> {
  const assertion = await signAtbClientAssertion();
  const authUrl = (
    process.env.ATB_AUTH_URL?.trim() || DEFAULT_ATB_AUTH_URL
  ).replace(/\/+$/, '');
  const tokenUrl = `${authUrl}/atbaccesstokens/v2`;
  const now = Date.now();

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-atb-api-key': getEnv('ATB_API_KEY'),
      client_assertion: assertion,
      client_assertion_type: ATB_ASSERTION_TYPE,
    },
    body: JSON.stringify({
      username: getEnv('ATB_USERNAME'),
      password: getEnv('ATB_PASSWORD'),
    }),
    cache: 'no-store',
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `ATB token request failed: ${response.status} ${response.statusText}${
        responseText ? ` — ${responseText.slice(0, 300)}` : ''
      }`,
    );
  }

  let parsed: { access_token?: string; expires_in?: number };
  try {
    parsed = JSON.parse(responseText) as {
      access_token?: string;
      expires_in?: number;
    };
  } catch {
    throw new Error('ATB token response was not JSON.');
  }

  if (!parsed.access_token) {
    throw new Error('ATB token response missing access_token.');
  }

  const expiresInMs = Math.max((parsed.expires_in ?? 3600) - 60, 1) * 1000;

  atbAuth = {
    accessToken: parsed.access_token,
    clientAssertion: assertion,
    tokenExpiryMs: now + expiresInMs,
    assertionExpiryMs: now + ATB_ASSERTION_LIFETIME_MS,
  };
  return atbAuth;
}

async function ensureAtbAuth(): Promise<AtbAuthState> {
  if (atbAuth && atbAuthStillValid(atbAuth)) {
    return atbAuth;
  }
  if (atbAuthInflight) {
    return atbAuthInflight;
  }
  atbAuthInflight = refreshAtbAuth().finally(() => {
    atbAuthInflight = null;
  });
  return atbAuthInflight;
}

type LedgerAuthState = {
  accessToken: string;
  workspace: string;
  tokenExpiryMs: number;
};

let ledgerAuth: LedgerAuthState | null = null;
let ledgerAuthInflight: Promise<LedgerAuthState> | null = null;

function getLedgerWorkspace(): string {
  return getEnvAny('LEDGER_WORKSPACE', 'LEDGER_VAULT_NAME');
}

function ledgerAuthStillValid(state: LedgerAuthState, now = Date.now()): boolean {
  return Boolean(state.accessToken) && now + LEDGER_AUTH_RENEW_BEFORE_MS < state.tokenExpiryMs;
}

async function refreshLedgerAuth(): Promise<LedgerAuthState> {
  const workspace = getLedgerWorkspace();
  const keyId = getEnv('LEDGER_API_KEY_ID');
  const keySecret = getEnv('LEDGER_API_KEY_SECRET');
  const tokenUrl = new URL(
    '/auth/token',
    process.env.LEDGER_BASE_URL?.trim() || DEFAULT_LEDGER_BASE_URL,
  );

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ledger-Workspace': workspace,
    },
    body: JSON.stringify({
      api_key_id: keyId,
      api_key_secret: keySecret,
    }),
    cache: 'no-store',
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Ledger token request failed: ${response.status} ${response.statusText}${
        responseText ? ` — ${responseText.slice(0, 300)}` : ''
      }`,
    );
  }

  let parsed: { access_token?: string; expires_in?: number };
  try {
    parsed = JSON.parse(responseText) as {
      access_token?: string;
      expires_in?: number;
    };
  } catch {
    throw new Error('Ledger token response was not JSON.');
  }

  if (!parsed.access_token) {
    throw new Error('Ledger token response missing access_token.');
  }

  const expiresInMs = Math.max((parsed.expires_in ?? 300) - 60, 1) * 1000;
  ledgerAuth = {
    accessToken: parsed.access_token,
    workspace,
    tokenExpiryMs: Date.now() + expiresInMs,
  };
  return ledgerAuth;
}

async function ensureLedgerAuth(): Promise<LedgerAuthState> {
  if (ledgerAuth && ledgerAuthStillValid(ledgerAuth)) {
    return ledgerAuth;
  }
  if (ledgerAuthInflight) {
    return ledgerAuthInflight;
  }
  ledgerAuthInflight = refreshLedgerAuth().finally(() => {
    ledgerAuthInflight = null;
  });
  return ledgerAuthInflight;
}

function collectJsonPaths(value: unknown, prefix = '', into = new Set<string>()) {
  if (value === null || value === undefined) {
    if (prefix) {
      into.add(prefix);
    }
    return into;
  }

  if (Array.isArray(value)) {
    into.add(prefix ? `${prefix}[]` : '[]');
    for (const item of value) {
      collectJsonPaths(item, prefix ? `${prefix}[]` : '[]', into);
    }
    return into;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key === '_meta' && prefix === '') {
        continue;
      }
      collectJsonPaths(nested, prefix ? `${prefix}.${key}` : key, into);
    }
    return into;
  }

  if (prefix) {
    into.add(prefix);
  }
  return into;
}

export type ShapeDiff = {
  onlyInMockoon: string[];
  onlyInReal: string[];
  sharedCount: number;
};

export function diffPayloadShapes(
  mockoonData: unknown,
  realData: unknown,
): ShapeDiff {
  const mockPaths = collectJsonPaths(mockoonData);
  const realPaths = collectJsonPaths(realData);
  const onlyInMockoon = [...mockPaths].filter((path) => !realPaths.has(path)).sort();
  const onlyInReal = [...realPaths].filter((path) => !mockPaths.has(path)).sort();

  return {
    onlyInMockoon,
    onlyInReal,
    sharedCount: [...mockPaths].filter((path) => realPaths.has(path)).length,
  };
}

function getTargetBaseUrl(provider: ProviderId, target: ForwardTarget): string {
  if (target === 'mockoon') {
    return (
      process.env[MOCKOON_BASE_URL_ENV[provider]]?.trim() ||
      process.env.MOCKOON_BASE_URL?.trim() ||
      DEFAULT_MOCKOON_BASE_URL
    );
  }

  if (provider === 'fireblocks') {
    return (
      process.env.FIREBLOCKS_BASE_URL?.trim() || DEFAULT_FIREBLOCKS_BASE_URL
    );
  }

  if (provider === 'allium') {
    return process.env.ALLIUM_BASE_URL?.trim() || DEFAULT_ALLIUM_BASE_URL;
  }

  if (provider === 'coinapi') {
    return process.env.COINAPI_BASE_URL?.trim() || DEFAULT_COINAPI_BASE_URL;
  }

  if (provider === 'atb') {
    return process.env.ATB_BASE_URL?.trim() || DEFAULT_ATB_BASE_URL;
  }

  if (provider === 'allnodes') {
    throw new Error('Allnodes RPC URL is selected per chain, not from a shared base.');
  }

  if (provider === 'ledger') {
    return process.env.LEDGER_BASE_URL?.trim() || DEFAULT_LEDGER_BASE_URL;
  }

  if (provider === 'anchorage') {
    return process.env.ANCHORAGE_BASE_URL?.trim() || DEFAULT_ANCHORAGE_BASE_URL;
  }

  return process.env.BITGO_BASE_URL?.trim() || DEFAULT_BITGO_BASE_URL;
}

function buildHeaders({
  provider,
  target,
  pathWithQuery,
  body,
  bodyText,
}: {
  provider: ProviderId;
  target: ForwardTarget;
  pathWithQuery: string;
  body: unknown;
  bodyText: string;
}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...(bodyText ? { 'Content-Type': 'application/json' } : {}),
  };

  if (target === 'mockoon') {
    return Promise.resolve(headers);
  }

  if (provider === 'fireblocks') {
    return signJwt(pathWithQuery, body).then((token) => {
      headers.Authorization = `Bearer ${token}`;
      headers['X-API-Key'] = getEnv('FIREBLOCKS_API_KEY');
      return headers;
    });
  }

  if (provider === 'allium') {
    const token = getEnv('ALLIUM_API_KEY');
    headers['X-API-KEY'] = token;
    return Promise.resolve(headers);
  }

  if (provider === 'coinapi') {
    const key = getEnv('COINAPI_API_KEY');
    headers['X-CoinAPI-Key'] = key;
    return Promise.resolve(headers);
  }

  if (provider === 'bitgo') {
    const token = getEnvAny('BITGO_ACCESS_TOKEN', 'BITGO_API_KEY');
    headers.Authorization = `Bearer ${token}`;
    return Promise.resolve(headers);
  }

  if (provider === 'atb') {
    return ensureAtbAuth().then((auth) => {
      headers.Authorization = `Bearer ${auth.accessToken}`;
      headers['x-atb-api-key'] = getEnv('ATB_API_KEY');
      headers.client_assertion = auth.clientAssertion;
      headers.client_assertion_type = ATB_ASSERTION_TYPE;
      return headers;
    });
  }

  if (provider === 'ledger') {
    const workspace =
      process.env.LEDGER_WORKSPACE?.trim() ||
      process.env.LEDGER_VAULT_NAME?.trim();
    const keyId = process.env.LEDGER_API_KEY_ID?.trim();
    const keySecret = process.env.LEDGER_API_KEY_SECRET?.trim();
    const staticToken = process.env.LEDGER_ACCESS_TOKEN?.trim();
    const apiUser =
      process.env.LEDGER_API_USER?.trim() || process.env.LEDGER_USER?.trim();
    const apiKey =
      process.env.LEDGER_API_KEY?.trim() || process.env.LEDGER_KEY?.trim();

    if (keyId || keySecret) {
      if (!keyId || !keySecret) {
        throw new Error(
          'Set both LEDGER_API_KEY_ID and LEDGER_API_KEY_SECRET for live Vault token auth.',
        );
      }
      return ensureLedgerAuth().then((auth) => {
        headers.Authorization = `Bearer ${auth.accessToken}`;
        headers['X-Ledger-Workspace'] = auth.workspace;
        return headers;
      });
    }

    if (staticToken) {
      headers.Authorization = `Bearer ${staticToken}`;
      if (workspace) {
        headers['X-Ledger-Workspace'] = workspace;
      }
      return Promise.resolve(headers);
    }

    if (apiUser) {
      headers['X-Ledger-API-User'] = apiUser;
      if (apiKey) {
        headers['X-Ledger-API-Key'] = apiKey;
      }
      if (workspace) {
        headers['X-Ledger-Workspace'] = workspace;
      }
      return Promise.resolve(headers);
    }

    throw new Error(
      'Set LEDGER_API_KEY_ID, LEDGER_API_KEY_SECRET, and LEDGER_WORKSPACE (or LEDGER_VAULT_NAME) for live Vault token auth. Alternatively set LEDGER_ACCESS_TOKEN, or LEDGER_API_USER for LAM headers.',
    );
  }

  if (provider === 'anchorage') {
    headers.Accept = 'application/json';
    headers['Api-Access-Key'] = getEnvAny(
      'ANCHORAGE_API_KEY',
      'ANCHORAGE_API_ACCESS_KEY',
    );
    return Promise.resolve(headers);
  }

  return Promise.resolve(headers);
}

export async function callApi({
  provider,
  method,
  path,
  query,
  body,
  target = 'real',
}: ApiRequestInput) {
  const { path: normalizedPath, query: resolvedQuery } =
    resolveProviderPlaceholders(provider, path, query, target);

  let url: URL;
  let basicAuth: string | undefined;
  let resolvedBody = body;

  if (provider === 'allnodes') {
    if (body === undefined || body === null) {
      throw new Error('Allnodes JSON-RPC body is required.');
    }

    let { chain, rpcSuffix } = parseAllnodesPath(normalizedPath, resolvedQuery);
    const methodName = jsonRpcMethodName(body);
    if (
      chain === 'btc' &&
      methodName &&
      ALLNODES_BTC_WALLET_METHODS.has(methodName) &&
      !rpcSuffix.includes('/wallet/')
    ) {
      rpcSuffix = `/wallet/{walletName}`;
    }

    const haystack = `${normalizedPath}\n${rpcSuffix}\n${JSON.stringify(body)}`;
    const stripped = stripUrlUserInfo(new URL(getAllnodesRpcUrl(chain)));
    const vars =
      target === 'mockoon'
        ? syntheticAllnodesValues()
        : await resolveAllnodesLiveValues(
            chain,
            stripped.href,
            stripped.authorization,
            haystack,
          );

    rpcSuffix = String(applyPlaceholders(rpcSuffix, vars));
    resolvedBody = applyPlaceholders(body, vars);

    if (target === 'mockoon') {
      url = joinMockoonUrl(
        getTargetBaseUrl(provider, target),
        `/${chain}${rpcSuffix}`,
      );
    } else {
      url = new URL(joinRpcPath(stripped.href, rpcSuffix));
      basicAuth = stripped.authorization;
    }
  } else if (target === 'mockoon') {
    url = joinMockoonUrl(getTargetBaseUrl(provider, target), normalizedPath);
  } else {
    url = new URL(normalizedPath, getTargetBaseUrl(provider, target));
  }

  if (resolvedQuery) {
    for (const [key, value] of Object.entries(resolvedQuery)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (key === 'chain' && provider === 'allnodes') {
        continue;
      }

      if (target === 'real' && key === 'scenario') {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  const bodyText = serializeBody(resolvedBody);
  const headers = await buildHeaders({
    provider,
    target,
    pathWithQuery: `${normalizedPath}${url.search}`,
    body: resolvedBody,
    bodyText,
  });

  if (basicAuth) {
    headers.Authorization = basicAuth;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: bodyText || undefined,
    cache: 'no-store',
  });

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let data: unknown = responseText;

  if (contentType.includes('application/json') && responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data,
  };
}

function failedCall(error: unknown) {
  return {
    ok: false as const,
    status: 0,
    statusText: 'error',
    data: {
      error: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}

export async function callBothApis(input: Omit<ApiRequestInput, 'target'>) {
  const [mockoon, real] = await Promise.all([
    callApi({ ...input, target: 'mockoon' }).catch(failedCall),
    callApi({ ...input, target: 'real' }).catch(failedCall),
  ]);

  return {
    ok: mockoon.ok && real.ok,
    status: mockoon.ok && real.ok ? 200 : 502,
    statusText: mockoon.ok && real.ok ? 'OK' : 'Mismatch or error',
    data: {
      mockoon,
      real,
      shape: diffPayloadShapes(mockoon.data, real.data),
    },
  };
}
