'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Preset,
  ProviderId,
  RequestMethod,
  presetsGroupedByProvider,
} from '@/lib/presets';

type ApiResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  error?: string;
  data?: unknown;
};

type ServerTarget = 'real' | 'mockoon';

const TARGET_OPTIONS: Array<{ value: ServerTarget; label: string }> = [
  { value: 'real', label: 'Real Server' },
  { value: 'mockoon', label: 'Mockoon' },
];

const METHOD_OPTIONS: RequestMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

const providerInfo: Record<
  ProviderId,
  {
    label: string;
    defaultPath: string;
    notes: string;
    authSummary: string;
  }
> = {
  fireblocks: {
    label: 'Fireblocks',
    defaultPath: '/v1/vault/accounts_paged',
    notes: 'JWT + X-API-Key on real mode',
    authSummary: 'JWT + X-API-Key',
  },
  allium: {
    label: 'Allium',
    defaultPath: '/v1/address/{address}',
    notes: 'Bearer token from ALLIUM_API_KEY',
    authSummary: 'Bearer ALLIUM_API_KEY',
  },
  coinapi: {
    label: 'CoinAPI',
    defaultPath: '/v1/exchangerate/BTC/USD',
    notes: 'Bearer token from COINAPI_API_KEY',
    authSummary: 'Bearer COINAPI_API_KEY',
  },
  bitgo: {
    label: 'BitGo',
    defaultPath: '/v2/wallets',
    notes: 'Bearer token from BITGO_API_KEY',
    authSummary: 'Bearer BITGO_API_KEY',
  },
};

const exampleQuery = '{\n  "limit": 10\n}';
const exampleBody =
  '{\n  "assetId": "ETH_TEST3",\n  "amount": "0.01",\n  "source": {\n    "type": "VAULT_ACCOUNT",\n    "id": "0"\n  },\n  "destination": {\n    "type": "ONE_TIME_ADDRESS",\n    "oneTimeAddress": {\n      "address": "0x0000000000000000000000000000000000000000"\n    }\n  }\n}';

function formatJson(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function parseJsonField(label: string, value: string) {
  if (!value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

export default function Home() {
  const [provider, setProvider] = useState<ProviderId>('fireblocks');
  const [target, setTarget] = useState<ServerTarget>('real');
  const [method, setMethod] = useState<RequestMethod>('GET');
  const [path, setPath] = useState(providerInfo.fireblocks.defaultPath);
  const [queryText, setQueryText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [isPending, startTransition] = useTransition();

  const providerSummary = providerInfo[provider];

  const prettyResponse = useMemo(() => {
    if (!response) {
      return 'Run a request to inspect the provider response.';
    }

    return formatJson(response.data ?? response);
  }, [response]);

  function applyProvider(nextProvider: ProviderId) {
    setProvider(nextProvider);
    setMethod('GET');
    setPath(providerInfo[nextProvider].defaultPath);
    setQueryText('');
    setBodyText('');
    setClientError(null);
    setSelectedPreset(null);
  }

  function applyPreset(preset: Preset) {
    setProvider(preset.provider);
    setMethod(preset.method);
    setPath(preset.path);
    setQueryText(preset.query ?? '');
    setBodyText(preset.body ?? '');
    setClientError(null);
    setSelectedPreset(preset);
  }

  async function submitRequest() {
    try {
      setClientError(null);

      const query = parseJsonField('Query', queryText);
      const body = parseJsonField('Body', bodyText);

      const result = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          target,
          method,
          path,
          query,
          body,
        }),
      });

      const payload = (await result.json()) as ApiResponse;
      setResponse(payload);
    } catch (error) {
      setResponse(null);
      setClientError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(180deg,_#f7f5ef_0%,_#f3efe4_46%,_#ebe5d5_100%)] px-4 pb-6 text-stone-900 sm:px-6 lg:px-10'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-6'>
        <section className='overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(41,37,36,0.12)] backdrop-blur sm:p-8'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl space-y-4'>
              <span className='inline-flex w-fit items-center rounded-full border border-teal-900/15 bg-teal-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-50'>
                RelayForge
              </span>
              <div className='space-y-3'>
                <h1 className='max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl'>
                  Test and relay API requests across providers.
                </h1>
                <p className='max-w-2xl text-base leading-7 text-stone-700 sm:text-lg'>
                  Choose provider, target, method, and payload, then inspect raw
                  responses. The browser only talks to the local Next.js route,
                  so auth secrets stay server-side.
                </p>
              </div>
            </div>

            <div className='grid gap-3 rounded-[1.5rem] border border-stone-200/80 bg-stone-950 px-5 py-4 text-sm text-stone-200 sm:grid-cols-3 lg:min-w-[28rem]'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-stone-400'>
                  Provider
                </p>
                <p className='mt-2 font-mono text-xs text-stone-100'>
                  {providerSummary.label}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-stone-400'>
                  Target
                </p>
                <p className='mt-2 font-mono text-xs text-stone-100'>
                  {target === 'real' ? 'Real Server' : 'Mockoon'}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-stone-400'>
                  Auth Mode
                </p>
                <p className='mt-2 font-mono text-xs text-stone-100'>
                  {providerSummary.authSummary}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'>
          <div className='rounded-[2rem] border border-stone-200/80 bg-white/80 p-5 shadow-[0_16px_48px_rgba(41,37,36,0.08)] backdrop-blur sm:p-6'>
            <fieldset className='space-y-2'>
              <span className='text-sm font-medium text-stone-700'>Target</span>
              <div className='flex gap-4'>
                {TARGET_OPTIONS.map((option) => (
                  <label key={option.value} className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='target'
                      value={option.value}
                      checked={target === option.value}
                      onChange={(event) =>
                        setTarget(event.target.value as ServerTarget)
                      }
                      className='h-4 w-4 cursor-pointer'
                    />
                    <span className='text-sm font-medium text-stone-700'>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className='mt-6 grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] xl:grid-cols-[8rem_5rem_minmax(0,1fr)]'>
              <label className='space-y-2'>
                <span className='text-sm font-medium text-stone-700'>
                  Provider
                </span>
                <select
                  value={provider}
                  onChange={(event) =>
                    applyProvider(event.target.value as ProviderId)
                  }
                  className='h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 outline-none ring-0 transition focus:border-teal-600'
                >
                  {Object.entries(providerInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-medium text-stone-700'>
                  Method
                </span>
                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value as RequestMethod)
                  }
                  className='h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 outline-none ring-0 transition focus:border-teal-600'
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-medium text-stone-700'>Path</span>
                <input
                  value={path}
                  onChange={(event) => setPath(event.target.value)}
                  placeholder={providerSummary.defaultPath}
                  className='h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 font-mono text-sm text-stone-900 outline-none transition focus:border-teal-600'
                />
              </label>
            </div>

            <div className='mt-6 space-y-4'>
              {presetsGroupedByProvider[provider].map((group) => (
                <div key={group.category}>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600'>
                    {group.category}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {group.presets.map((preset) => (
                      <button
                        key={`${preset.provider}-${preset.label}`}
                        type='button'
                        onClick={() => applyPreset(preset)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selectedPreset?.label === preset.label
                            ? 'border-teal-600 bg-teal-100 text-teal-900'
                            : 'border-stone-300 bg-stone-50 text-stone-700 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-4 grid gap-4 xl:grid-cols-2'>
              <label className='space-y-2'>
                <span className='text-sm font-medium text-stone-700'>
                  Query JSON
                </span>
                <textarea
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                  placeholder={exampleQuery}
                  className='min-h-44 w-full rounded-[1.5rem] border border-stone-300 bg-stone-950 px-4 py-3 font-mono text-sm leading-6 text-stone-100 outline-none transition focus:border-teal-500'
                />
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-medium text-stone-700'>
                  Body JSON
                </span>
                <textarea
                  value={bodyText}
                  onChange={(event) => setBodyText(event.target.value)}
                  placeholder={exampleBody}
                  className='min-h-44 w-full rounded-[1.5rem] border border-stone-300 bg-stone-950 px-4 py-3 font-mono text-sm leading-6 text-stone-100 outline-none transition focus:border-amber-500'
                />
              </label>
            </div>

            <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='text-sm text-stone-700'>
                  Use provider paths like{' '}
                  <span className='font-mono text-stone-950'>
                    {providerSummary.defaultPath}
                  </span>
                  . Target mode controls whether requests go to the real server
                  or to Mockoon. {providerSummary.notes}. Query and body inputs
                  are optional JSON objects.
                </p>
              </div>
            </div>

            {clientError ? (
              <div className='mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                {clientError}
              </div>
            ) : null}
          </div>

          <div className='rounded-[2rem] border border-stone-200/80 bg-stone-950 p-5 text-stone-100 shadow-[0_16px_48px_rgba(41,37,36,0.12)] sm:p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <p className='text-xs uppercase tracking-[0.22em] text-stone-400'>
                  Response
                </p>
                <h2 className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-white'>
                  Inspect the raw payload
                </h2>
              </div>

              <div
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  response
                    ? response.ok
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-white/10 bg-white/5 text-stone-300'
                }`}
              >
                {response ? (
                  <span>
                    {response.ok ? 'Success' : 'Failure'}
                    {typeof response.status === 'number'
                      ? ` · ${response.status}`
                      : ''}
                    {response.statusText ? ` ${response.statusText}` : ''}
                  </span>
                ) : (
                  <span>Idle</span>
                )}
              </div>
            </div>

            <div className='mt-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4'>
              <pre className='max-h-[34rem] overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-teal-100'>
                {prettyResponse}
              </pre>
            </div>

            <div className='mt-5 grid gap-3 text-sm text-stone-300'>
              <div className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3'>
                The local API route applies provider-specific auth and forwards
                your request to the selected real or mock server.
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3'>
                Keep provider secrets in server-side env vars (for example
                FIREBLOCKS_SECRET_KEY, ALLIUM_API_KEY, COINAPI_API_KEY,
                BITGO_API_KEY).
              </div>
            </div>
          </div>
        </section>

        <button
          type='button'
          onClick={() => startTransition(submitRequest)}
          disabled={isPending}
          className='fixed bottom-6 right-6 z-50 inline-flex h-14 items-center justify-center rounded-full bg-stone-950 px-8 text-sm font-semibold text-stone-50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-500 lg:bottom-10 lg:right-10'
        >
          {isPending ? 'Running...' : 'Send'}
        </button>
      </div>
    </main>
  );
}
