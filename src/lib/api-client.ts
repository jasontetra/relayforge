import { createHash, createPrivateKey, randomUUID } from 'node:crypto';

import { SignJWT } from 'jose';

const DEFAULT_FIREBLOCKS_BASE_URL = 'https://api.fireblocks.io/v1';
const DEFAULT_ALLIUM_BASE_URL = 'https://api.allium.so';
const DEFAULT_COINAPI_BASE_URL = 'https://rest.coinapi.io';
const DEFAULT_BITGO_BASE_URL = 'https://app.bitgo.com';
const DEFAULT_MOCKOON_BASE_URL = 'http://127.0.0.1:8080';
const DEFAULT_BITGO_MOCK_ENTERPRISE_ID = '5a7a5c5c5c5c5c5c5c5c5c5c';
const BITGO_ENTERPRISE_PLACEHOLDER = '{enterpriseId}';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ProviderId = 'fireblocks' | 'allium' | 'coinapi' | 'bitgo';
export type ServerTarget = 'real' | 'mockoon';

export type ApiRequestInput = {
  provider: ProviderId;
  method: RequestMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  target?: ServerTarget;
};

// Each provider mock listens on its own port, so MOCKOON_BASE_URL only acts as
// the shared fallback.
const MOCKOON_BASE_URL_ENV: Record<ProviderId, string> = {
  fireblocks: 'FIREBLOCKS_MOCKOON_BASE_URL',
  allium: 'ALLIUM_MOCKOON_BASE_URL',
  coinapi: 'COINAPI_MOCKOON_BASE_URL',
  bitgo: 'BITGO_MOCKOON_BASE_URL',
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

function getBitgoEnterpriseId(target: ServerTarget): string {
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
  target: ServerTarget,
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

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n').trim();
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

function getTargetBaseUrl(provider: ProviderId, target: ServerTarget): string {
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
  target: ServerTarget;
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
    provider === 'bitgo'
      ? resolveBitgoEnterprise(normalizePath(path), query, target)
      : { path: normalizePath(path), query };
  const baseUrl = getTargetBaseUrl(provider, target);
  const url = new URL(normalizedPath, baseUrl);

  if (resolvedQuery) {
    for (const [key, value] of Object.entries(resolvedQuery)) {
      if (value === undefined || value === null || value === '') {
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
