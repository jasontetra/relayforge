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

BITGO_BASE_URL=https://api.bitgo.com
BITGO_API_KEY=your-bitgo-api-key
```

Notes:

- `MOCKOON_BASE_URL` defaults to `http://127.0.0.1:8080` when omitted.
- Fireblocks real mode uses JWT + `X-API-Key`.
- Allium real mode uses `Bearer ALLIUM_API_KEY`.
- CoinAPI real mode uses `X-CoinAPI-Key` header.
- BitGo real mode uses `Bearer BITGO_API_KEY`.
- `FIREBLOCKS_SECRET_KEY` can use real newlines or escaped `\n` sequences.
- Keep all secrets server-side only.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use the form to send requests such as:

- Fireblocks: `GET /v1/vault/accounts_paged`
- Allium: `GET /v1/address/0x1234567890123456789012345678901234567890`
- CoinAPI: `GET /v1/exchangerate/BTC/USD`
- BitGo: `GET /v2/wallets`

## How it works

- The UI posts provider, target, method, path, query, and body JSON to `/api/test`.
- In real mode, the server applies provider-specific auth behavior.
- Fireblocks JWT claims are `uri`, `nonce`, `iat`, `exp`, `sub`, and `bodyHash`.
- In mockoon mode, the server forwards the same request path/query/body without provider auth headers.

## Validation

Run:

```bash
npm run lint
```
