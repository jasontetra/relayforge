# RelayForge

A TypeScript Next.js app for testing and relaying requests across multiple API providers from one console. The browser posts request details to a local Next.js route, and the server applies provider-specific auth before forwarding to the selected API.

## Environment

Create a `.env.local` file from `.env.example` and set these values:

```bash
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io
MOCKOON_BASE_URL=http://127.0.0.1:8080
FIREBLOCKS_API_KEY=your-fireblocks-api-key
FIREBLOCKS_SECRET_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

ALLIUM_BASE_URL=https://api.allium.so/api
ALLIUM_API_KEY=your-allium-api-key

COINAPI_BASE_URL=https://rest.coinapi.io
COINAPI_API_KEY=your-coinapi-api-key

BITGO_BASE_URL=https://app.bitgo.com
BITGO_ACCESS_TOKEN=your-bitgo-access-token
BITGO_ENTERPRISE_ID=your-bitgo-enterprise-id

ATB_BASE_URL=https://preprod.api.atb.com
ATB_AUTH_URL=https://preprod.api.atb.com
ATB_API_KEY=your-atb-api-key
ATB_USERNAME=your-atb-username
ATB_PASSWORD=your-atb-password
ATB_CLIENT_ID=your-atb-client-id
ATB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
ATB_ACCOUNT_ID=your-atb-account-id
```

Notes:

- `MOCKOON_BASE_URL` defaults to `http://127.0.0.1:8080` when omitted.
- Fireblocks real mode uses JWT + `X-API-Key`.
- Allium real mode uses `X-API-KEY` header.
- CoinAPI real mode uses `X-CoinAPI-Key` header.
- BitGo real mode uses `Bearer BITGO_ACCESS_TOKEN` (`BITGO_API_KEY` still works).
- ATB real mode posts to `/atbaccesstokens/v2`, then sends `Authorization`, `x-atb-api-key`, and `client_assertion` on FDX routes. Live ATB is IP-allowlisted; laptop calls often fail. `ATB_PRIVATE_KEY` accepts PKCS#1, PKCS#8, or an unencrypted OpenSSH RSA key.
- `FIREBLOCKS_SECRET_KEY` and `ATB_PRIVATE_KEY` can use real newlines or escaped `\n` sequences.
- Keep all secrets server-side only.

### Mock targets

Each provider mock in `unity-dependencies` listens on its own port, so a single
`MOCKOON_BASE_URL` cannot reach all of them. Set a per-provider override to point
mockoon mode at the right port; the provider-specific value wins, then
`MOCKOON_BASE_URL`, then the default.

Point these at Mockoon directly, not at `mock-proxy` on `8080`. The proxy serves
one provider per process and expects namespaced paths like
`/_mock/ns/<namespace>/<provider-path>`, so sending a bare provider path there
returns 404.

```bash
FIREBLOCKS_MOCKOON_BASE_URL=http://127.0.0.1:9001
ALLIUM_MOCKOON_BASE_URL=http://127.0.0.1:9002
COINAPI_MOCKOON_BASE_URL=http://127.0.0.1:9000
BITGO_MOCKOON_BASE_URL=http://127.0.0.1:9003
ATB_MOCKOON_BASE_URL=http://127.0.0.1:9004
```

## BitGo

BitGo serves the same `/api/v2/...` paths in both modes, so a preset works
against the real API and the mock without edits.

| | Base URL |
| --- | --- |
| Production | `https://app.bitgo.com` |
| Test | `https://app.bitgo-test.com` |
| Mock | `http://127.0.0.1:9003` |

Set `BITGO_BASE_URL` to the host only. Paths keep their `/api/v2` prefix, since an
absolute path replaces any path already on the base URL.

Start the mock from the `unity-dependencies` checkout:

```bash
npx @mockoon/cli start --data mocks/bitgo/v1/mockoon.json --port 9003
```

Enterprise-scoped presets use a `{enterpriseId}` placeholder that the server
substitutes per target: `BITGO_ENTERPRISE_ID` on the real target, and
`BITGO_MOCK_ENTERPRISE_ID` on mockoon (defaulting to the mock's enterprise).
Both targets return 404 on the enterprise transfer route for an unrecognized
enterprise, so the two need different values. `BITGO_ENTERPRISE_ID` is only
required for requests that actually use the placeholder — currently just the
enterprise transfer feed, since `GET /api/v2/wallets` accepts an `enterprise`
query parameter but ignores it.

BitGo presets use ids the mock resolves, so every preset runs unedited in mockoon
mode. Swap in your own ids for real mode. Other ids the mock knows:

- Coins: `hteth`, `tbtc`
- Wallets: `59cd72485007a239fae4aa1ffdd5ab52`, `59cd72485007a239fae4aa1ffdd5ab53` (`hteth`), `59cd72485007a239fae4aa1ffdd5ab62` (`tbtc`)
- Transfers: `aaaa0001000040008fb0000000000001`, `bbbb0001000040008fb0000000000001`, `dddd0001000040008fb0000000000001`
- Enterprise: `5a7a5c5c5c5c5c5c5c5c5c5c`

To exercise a non-default mock scenario such as `rate_limited`, `unauthorized`,
`provider_error`, or `malformed_payload`, add it to the Query JSON:

```json
{ "scenario": "rate_limited" }
```

## ATB

ATB serves the same `/fdx/5.3/...` paths in both modes, so a preset works against
the real API and the mock without edits.

| | Base URL |
| --- | --- |
| Preprod | `https://preprod.api.atb.com` |
| Production | `https://api.atb.com` |
| Mock | `http://127.0.0.1:9004` |

Set `ATB_BASE_URL` to the host only. Paths keep their `/fdx` prefix, since an
absolute path replaces any path already on the base URL. Token issuance uses
`ATB_AUTH_URL` (`POST /atbaccesstokens/v2`); the unity-dependencies mock does
not implement that route.

Start the mock from the `unity-dependencies` checkout:

```bash
npx @mockoon/cli start --data mocks/atb/v1/mockoon.json --port 9004
```

Account-scoped presets use a `{accountId}` placeholder that the server
substitutes per target: `ATB_ACCOUNT_ID` on the real target, and
`ATB_MOCK_ACCOUNT_ID` on mockoon (default `syn-acct-0001`).

Use target **Both (compare)** to fire mockoon and real in parallel. The response
includes each payload plus a field-path diff (`onlyInMockoon` / `onlyInReal`).
`_meta` on mock fixtures is ignored in that diff. Values will not match: the
mock is synthetic. Shape overlap is the useful check. Real mode may fail from
a developer laptop because ATB allowlists Tetra egress IPs.

To exercise a non-default mock scenario such as `unattributed_eft_credit`,
`empty_transaction_id`, or `rate_limited`, add it to the Query JSON:

```json
{ "scenario": "unattributed_eft_credit" }
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use the form to send requests such as:

- Fireblocks: `GET /v1/vault/accounts_paged`
- Allium: `GET /v1/address/0x1234567890123456789012345678901234567890`
- CoinAPI: `GET /v1/exchangerate/BTC/USD`
- BitGo: `GET /api/v2/hteth/wallet`
- ATB: `GET /fdx/5.3/accounts`

## How it works

- The UI posts provider, target, method, path, query, and body JSON to `/api/request`.
- In real mode, the server applies provider-specific auth behavior.
- Fireblocks JWT claims are `uri`, `nonce`, `iat`, `exp`, `sub`, and `bodyHash`.
- In mockoon mode, the server forwards the same request path/query/body without provider auth headers.
- Target **Both (compare)** calls mockoon and real in parallel and returns a field-path diff.

## Validation

Run:

```bash
npm run lint
```
