import { createHash, createPrivateKey, randomUUID } from 'node:crypto';

import { SignJWT } from 'jose';

const DEFAULT_FIREBLOCKS_BASE_URL = 'https://sandbox-api.fireblocks.io';
const DEFAULT_ALLIUM_BASE_URL = 'https://api.allium.so/api';
const DEFAULT_COINAPI_BASE_URL = 'https://rest.coinapi.io';
const DEFAULT_BITGO_BASE_URL = 'https://api.bitgo.com';
const DEFAULT_MOCKOON_BASE_URL = 'http://127.0.0.1:8080';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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
    return process.env.MOCKOON_BASE_URL?.trim() || DEFAULT_MOCKOON_BASE_URL;
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
    headers.Authorization = `Bearer ${token}`;
    return Promise.resolve(headers);
  }

  if (provider === 'coinapi') {
    const key = getEnv('COINAPI_API_KEY');
    headers['X-CoinAPI-Key'] = key;
    return Promise.resolve(headers);
  }

  if (provider === 'bitgo') {
    const token = getEnv('BITGO_API_KEY');
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
  const normalizedPath = normalizePath(path);
  const baseUrl = getTargetBaseUrl(provider, target);
  const url = new URL(normalizedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
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
