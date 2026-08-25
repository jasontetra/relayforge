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

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ProviderId =
  | 'fireblocks'
  | 'allium'
  | 'coinapi'
  | 'bitgo'
  | 'atb';
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
  const baseUrl = getTargetBaseUrl(provider, target);
  const url = new URL(normalizedPath, baseUrl);

  if (resolvedQuery) {
    for (const [key, value] of Object.entries(resolvedQuery)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (target === 'real' && key === 'scenario') {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  const bodyText = serializeBody(body);
  const headers = await buildHeaders({
    provider,
    target,
    pathWithQuery: `${normalizedPath}${url.search}`,
    body,
    bodyText,
  });

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
