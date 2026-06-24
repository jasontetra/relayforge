import { NextResponse } from 'next/server';

import { callApi, ProviderId, RequestMethod, ServerTarget } from '@/lib/api-client';

const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const allowedProviders = new Set<ProviderId>(['fireblocks', 'allium', 'coinapi', 'bitgo']);
const allowedTargets = new Set<ServerTarget>(['real', 'mockoon']);

type RequestPayload = {
  provider?: ProviderId;
  method?: string;
  path?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  target?: ServerTarget;
};

export async function POST(request: Request) {
  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const method = payload.method?.toUpperCase();
  const provider = payload.provider ?? 'fireblocks';
  const path = payload.path?.trim();
  const target = payload.target ?? 'real';

  if (!method || !allowedMethods.has(method)) {
    return NextResponse.json(
      { error: 'Method must be one of GET, POST, PUT, PATCH, DELETE.' },
      { status: 400 },
    );
  }

  if (!path) {
    return NextResponse.json({ error: 'Path is required.' }, { status: 400 });
  }

  if (!allowedProviders.has(provider)) {
    return NextResponse.json(
      {
        error: 'Provider must be one of fireblocks, allium, coinapi, bitgo.',
      },
      { status: 400 },
    );
  }

  if (!allowedTargets.has(target)) {
    return NextResponse.json(
      { error: 'Target must be one of real or mockoon.' },
      { status: 400 },
    );
  }

  try {
    const response = await callApi({
      provider,
      method: method as RequestMethod,
      path,
      query: payload.query,
      body: payload.body,
      target,
    });

    return NextResponse.json(response, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
