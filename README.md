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

ALLNODES_BTC_RPC_URL=https://bitcoin-rpc.publicnode.com
ALLNODES_ETH_RPC_URL=https://ethereum-rpc.publicnode.com
ALLNODES_BASE_RPC_URL=https://base-rpc.publicnode.com
ALLNODES_TEMPO_RPC_URL=https://tempo-rpc.publicnode.com
ALLNODES_BASESEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
ALLNODES_ETHSEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

LEDGER_BASE_URL=https://api.vault.ledger.com
LEDGER_WORKSPACE=
LEDGER_API_KEY_ID=
LEDGER_API_KEY_SECRET=
LEDGER_ACCOUNT_ID=
LEDGER_ENTITY_ID=
LEDGER_TX_ID=
LEDGER_REQUEST_ID=

ANCHORAGE_BASE_URL=https://api.anchorage-staging.com
ANCHORAGE_API_KEY=your-anchorage-api-access-key
ANCHORAGE_VAULT_ID=
ANCHORAGE_WALLET_ID=
ANCHORAGE_TX_ID=
```

Notes:

- `MOCKOON_BASE_URL` defaults to `http://127.0.0.1:8080` when omitted.
- Fireblocks real mode uses JWT + `X-API-Key`.
- Allium real mode uses `X-API-KEY` header.
- CoinAPI real mode uses `X-CoinAPI-Key` header.
- BitGo real mode uses `Bearer BITGO_ACCESS_TOKEN` (`BITGO_API_KEY` still works).
- ATB real mode posts to `/atbaccesstokens/v2`, then sends `Authorization`, `x-atb-api-key`, and `client_assertion` on FDX routes. Live ATB is IP-allowlisted; laptop calls often fail. `ATB_PRIVATE_KEY` accepts PKCS#1, PKCS#8, or an unencrypted OpenSSH RSA key.
- Allnodes real mode posts JSON-RPC to the per-chain RPC URL. Defaults are Allnodes PublicNode. Dedicated URLs may include `user:pass` (sent as HTTP Basic).
- Ledger real mode posts `POST /auth/token` with `LEDGER_API_KEY_ID` + `LEDGER_API_KEY_SECRET` and header `X-Ledger-Workspace` (`LEDGER_WORKSPACE` or `LEDGER_VAULT_NAME`), then sends `Authorization: Bearer` on Vault routes. Optional fallbacks: `LEDGER_ACCESS_TOKEN`, or LAM headers `LEDGER_API_USER` / `LEDGER_API_KEY`.
- Anchorage real mode sends `Api-Access-Key` from `ANCHORAGE_API_KEY` (or `ANCHORAGE_API_ACCESS_KEY`). Reads only; signed writes are out of scope.
- `FIREBLOCKS_SECRET_KEY` and `ATB_PRIVATE_KEY` can use real newlines or escaped `\n` sequences.
- Keep all secrets server-side only.

### Mock targets

Each provider mock in `unity-dependencies` listens on its own port, so a single
`MOCKOON_BASE_URL` cannot reach all of them. Set a per-provider override; the
provider-specific value wins, then `MOCKOON_BASE_URL`, then the default.

Mockoon mode joins the request path onto the base URL, so both host Mockoon and
Docker `mock-proxy` work. Use a t-ledger consumer namespace (`local`, etc.) on
the proxy — do not bake a RelayForge-specific path into unity-dependencies.

Host Mockoon (`npx @mockoon/cli` or `make mock-*-up`):

```bash
FIREBLOCKS_MOCKOON_BASE_URL=http://127.0.0.1:9001
ALLIUM_MOCKOON_BASE_URL=http://127.0.0.1:9002
COINAPI_MOCKOON_BASE_URL=http://127.0.0.1:9000
BITGO_MOCKOON_BASE_URL=http://127.0.0.1:9003
ATB_MOCKOON_BASE_URL=http://127.0.0.1:9004
ALLNODES_MOCKOON_BASE_URL=http://127.0.0.1:9005
LEDGER_MOCKOON_BASE_URL=http://127.0.0.1:9006
ANCHORAGE_MOCKOON_BASE_URL=http://127.0.0.1:9007
```

Docker Compose publishes the proxies (`:8080`–`:8087`), not the Mockoon ports.
Namespace only — RelayForge paths already include `/v1`, `/api/v2`, `/fdx`,
Allnodes chain (`/eth`, `/btc`, …), Ledger Vault paths (`/accounts`, …), and
Anchorage Digital v2 paths (`/v2/...`):

```bash
FIREBLOCKS_MOCKOON_BASE_URL=http://127.0.0.1:8081/_mock/ns/local
ALLIUM_MOCKOON_BASE_URL=http://127.0.0.1:8082/_mock/ns/local
COINAPI_MOCKOON_BASE_URL=http://127.0.0.1:8080/_mock/ns/local
BITGO_MOCKOON_BASE_URL=http://127.0.0.1:8083/_mock/ns/local
ATB_MOCKOON_BASE_URL=http://127.0.0.1:8084/_mock/ns/local
ALLNODES_MOCKOON_BASE_URL=http://127.0.0.1:8085/_mock/ns/local
LEDGER_MOCKOON_BASE_URL=http://127.0.0.1:8086/_mock/ns/local
ANCHORAGE_MOCKOON_BASE_URL=http://127.0.0.1:8087/_mock/ns/local
```

Query `{ "scenario": "stale" }` selects a catalog scenario against host Mockoon.
Through the proxy, assign the namespace scenario via the admin API instead.

## BitGo

BitGo serves the same `/api/v2/...` paths in both modes, so a preset works
against the real API and the mock without edits.

| | Base URL |
| --- | --- |
| Production | `https://app.bitgo.com` |
| Test | `https://app.bitgo-test.com` |
| Mock | `http://127.0.0.1:9003` |

Set `BITGO_BASE_URL` to the host only. Paths keep their `/api/v2` prefix. Real
mode replaces any path on the base; mockoon mode joins the path onto the mock
base so Docker proxy prefixes work.

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

Set `ATB_BASE_URL` to the host only. Paths keep their `/fdx` prefix. Real mode
replaces any path on the base; mockoon mode joins the path onto the mock base
(do not put `/fdx` on `ATB_MOCKOON_BASE_URL`). Token issuance uses
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

## Allnodes

Allnodes hosts per-chain JSON-RPC nodes. RelayForge posts the JSON-RPC body to
the selected chain's node URL. The **path is the chain selector**, not a path on
the node:

| Path | Chain |
| --- | --- |
| `/btc` | Bitcoin |
| `/eth` | Ethereum full |
| `/eth-archive` | Ethereum archive |
| `/base` | Base full |
| `/base-archive` | Base archive |
| `/tempo` | Tempo |
| `/basesepolia` | Base Sepolia |
| `/ethsepolia` | Ethereum Sepolia |

| | RPC URL |
| --- | --- |
| PublicNode (default) | `https://<chain>-rpc.publicnode.com` (see `.env.example`) |
| Dedicated host | set `ALLNODES_<CHAIN>_RPC_URL` |
| Mockoon | `ALLNODES_MOCKOON_BASE_URL` |

Host Mockoon is `http://127.0.0.1:9005`. Docker Compose mock-proxy is
`http://127.0.0.1:8085/_mock/ns/<namespace>` (chain comes from the path:
`/eth` → `.../ns/local/eth`).

```bash
npx @mockoon/cli@9.8.0 start --data mocks/allnodes/v1/mockoon.json --port 9005
# or: make mock-allnodes-up
# or: docker compose up --wait allnodes-mock allnodes-proxy
```

`user:pass` in a dedicated URL is sent as HTTP Basic and stripped from the
request URL. PublicNode needs no auth. Wallet RPCs such as Bitcoin `getbalance`
are blocked on PublicNode; they need a dedicated node and
`ALLNODES_BTC_WALLET` (Bitcoin Core path `/wallet/<name>`). On mockoon they use
`/btc/wallet/syn-wallet-0001`.

Presets use POST JSON-RPC for the in-scope chain, wallet, and transaction
commands. Placeholders are filled before the request:

| Placeholder | Real target | Mockoon |
| --- | --- | --- |
| `{blockHash}` / `{txHash}` | Recent block with a transaction | Synthetic hashes |
| `{btcBlockHash}` / `{btcTxid}` | Tip block and its first txid | Synthetic hashes |
| `{walletName}` | `ALLNODES_BTC_WALLET` | `ALLNODES_MOCK_BTC_WALLET` (`syn-wallet-0001`) |

JSON-RPC errors still return HTTP 200 with an `error` object in the body.
Query `{ "scenario": "stale" }` selects a catalog scenario (Mockoon header/query
rules), same as the other provider mocks.

```bash
# Example: Ethereum chain id via the local mock
curl -sS http://localhost:3000/api/request \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "allnodes",
    "target": "mockoon",
    "method": "POST",
    "path": "/eth",
    "body": { "jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": [] }
  }'
```

## Ledger

Ledger Vault API v1 serves the same `/accounts`, `/entities`, `/transactions`,
`/requests`, and `/currencies` paths in both modes, so a preset works against
the real API and the mock without edits. This is Vault API v1 at
`api.vault.ledger.com`, not REST v2 `/v1/rest`.

| | Base URL |
| --- | --- |
| Live | `https://api.vault.ledger.com` |
| Mock | `http://127.0.0.1:9006` |

Set `LEDGER_BASE_URL` to the host only. Paths keep their `/accounts` (etc.)
prefix. Real mode replaces any path on the base; mockoon mode joins the path
onto the mock base so Docker proxy prefixes work.

Live auth matches Vault API v1 and the Unity SDK: `POST /auth/token` with
`api_key_id` / `api_key_secret` and `X-Ledger-Workspace`, then
`Authorization: Bearer` plus `X-Ledger-Workspace` on later requests. Tokens
expire in about 300s and are refreshed automatically. Workspace is
`LEDGER_WORKSPACE` or `LEDGER_VAULT_NAME` (SSM `/unity/ledger/vault-name`).
API key id/secret are the values from “Generate API Access” (SSM
`/{env}/ledger-user-id` and `/{env}/ledger-user-secret` in Unity).

Account-scoped presets use placeholders resolved per target:

| Placeholder | Real | Mockoon |
| --- | --- | --- |
| `{accountId}` | `LEDGER_ACCOUNT_ID` | `LEDGER_MOCK_ACCOUNT_ID` (`1001`) |
| `{entityId}` | `LEDGER_ENTITY_ID` | `LEDGER_MOCK_ENTITY_ID` (`2001`) |
| `{txId}` | `LEDGER_TX_ID` | `LEDGER_MOCK_TX_ID` (`4001`) |
| `{requestId}` | `LEDGER_REQUEST_ID` | `LEDGER_MOCK_REQUEST_ID` (`5001`) |

`GET /accounts` and `GET /currencies` need no ids. Bitcoin/Solana get-account
presets still use mock ids `1003`/`1004`.

Start the mock from the `unity-dependencies` checkout:

```bash
npx @mockoon/cli@9.8.0 start --data mocks/ledger/v1/mockoon.json --port 9006
# or: make mock-ledger-up
# or: docker compose up --wait ledger-mock ledger-proxy
```

Host Mockoon is `http://127.0.0.1:9006`. Docker Compose mock-proxy is
`http://127.0.0.1:8086/_mock/ns/<namespace>`.

Presets use ids the mock resolves, so every preset runs unedited in mockoon
mode. Set live ids in env for real mode. Ids the mock knows:

- Entity: `2001`
- Accounts: `1001` (ethereum), `1002` (ethereum), `1003` (`bitcoin_testnet`), `1004` (solana, with USDC SPL token accounts)
- Transactions: `4001`–`4004`
- Request: `5001`
- Token: `GET /currencies/solana/tokens/USDCsyn11111111111111111111111111111111111`

To exercise a non-default mock scenario such as `rate_limited`, `unauthorized`,
`provider_error`, or `stale_data`, add it to the Query JSON:

```json
{ "scenario": "rate_limited" }
```

Through the proxy, assign the namespace scenario via the admin API instead.

```bash
# Example: list accounts via the local mock
curl -sS http://localhost:3000/api/request \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "ledger",
    "target": "mockoon",
    "method": "GET",
    "path": "/accounts"
  }'
```

## Anchorage

Anchorage Digital API v2 serves the same `/v2/asset-types`, `/v2/vaults`,
`/v2/wallets/{id}`, and `/v2/transactions` paths in both modes, so a preset
works against staging and the mock without edits. This is the official
`api.anchorage-staging.com` / `api.anchorage.com` prefix, the same surface
unity-backend's AnchorageSDK uses.

| | Base URL |
| --- | --- |
| Staging | `https://api.anchorage-staging.com` |
| Production | `https://api.anchorage.com` |
| Mock | `http://127.0.0.1:9007` |

Set `ANCHORAGE_BASE_URL` to the host only. Paths keep their `/v2` prefix.
Real mode sends `Api-Access-Key` from `ANCHORAGE_API_KEY` (or
`ANCHORAGE_API_ACCESS_KEY`). Mockoon mode skips auth. Writes and token
issuance are out of scope.

Placeholders resolve per target:

| Placeholder | Real | Mockoon |
| --- | --- | --- |
| `{vaultId}` | `ANCHORAGE_VAULT_ID` | `ANCHORAGE_MOCK_VAULT_ID` (`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`) |
| `{walletId}` | `ANCHORAGE_WALLET_ID` | `ANCHORAGE_MOCK_WALLET_ID` (`11111111111111111111111111111111`) |
| `{transactionId}` | `ANCHORAGE_TX_ID` | `ANCHORAGE_MOCK_TX_ID` (`aaaa0001000000000000000000000001`) |

Start the mock from the `unity-dependencies` checkout:

```bash
npx @mockoon/cli@9.8.0 start --data mocks/anchorage/v1/mockoon.json --port 9007
# or: make mock-anchorage-up
# or: docker compose up --wait anchorage-mock anchorage-proxy
```

Host Mockoon is `http://127.0.0.1:9007`. Docker Compose mock-proxy is
`http://127.0.0.1:8087/_mock/ns/<namespace>`.

Ids the mock knows:

- Vaults: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (ETHSEP + PYUSD_SEP), `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` (BTC_S + SOL)
- Wallets: `11…1` ETHSEP, `22…2` BTC_S, `33…3` empty, `44…4` archived ETH, `55…5` SOL + USDC_SOL
- Transactions: `aaaa0001…` ETHSEP deposit, `bbbb0001…` ETHSEP withdraw, `cccc0001…` BTC, `eeee0001…` SOL, `ffff0001…` USDC_SOL, `550e8400…` partial

Query `{ "scenario": "rate_limited" }` selects a catalog scenario on host
Mockoon. Through the proxy, assign the namespace scenario via the admin API.

```bash
# Example: list asset types via the local mock
curl -sS http://localhost:3000/api/request \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "anchorage",
    "target": "mockoon",
    "method": "GET",
    "path": "/v2/asset-types"
  }'
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
- Allnodes: `POST /eth` with `{ "jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": [] }`
- Ledger: `GET /accounts`
- Anchorage: `GET /v2/asset-types`

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
