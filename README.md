# Free Mine (BNB Testnet MVP)

MVP Web3 “free mining” app on BNB Smart Chain Testnet.

## Features

- Daily **off-chain** claim: once per UTC day.
- Base reward: **0.5 point/day**.
- Internal points in DB (no on-chain mint/withdraw for mined points).
- Wallet auth via signed message (`/api/auth/nonce`, `/api/auth/verify`) and session cookie.
- Buy acceleration packages by paying deployed **USDT Test (BEP-20)** in `Shop` contract.
- Package support:
  - Subscription (time-limited)
  - Lifetime
- Multiplier stacking rule: `MAX(highest lifetime, highest active subscription)`.
- Admin sync endpoint to ingest on-chain `Purchase` events:
  - `GET /api/admin/sync-purchases?fromBlock=...&toBlock=...`

## Tech

- Next.js (App Router + API routes)
- PostgreSQL + Prisma
- wagmi + viem
- Hardhat contracts/scripts

## 1) Setup

```bash
npm install
cp .env.example .env
```

Update `.env` values.

## 2) Database

```bash
npx prisma migrate dev --name init
```

## 3) Deploy contracts to BNB testnet

Ensure `.env` has:
- `BSC_TESTNET_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `TREASURY_ADDRESS`

Then:

```bash
npm run hardhat:compile
npm run hardhat:deploy
```

Deployment script prints USDT and Shop addresses.

Copy them into:
- `NEXT_PUBLIC_USDT_ADDRESS`
- `NEXT_PUBLIC_SHOP_ADDRESS`

## 4) Run app

```bash
npm run dev
```

Pages:
- `/` wallet connect, login, balance, multiplier, daily claim
- `/shop` approve USDT and buy packages
- `/admin` trigger on-chain purchase sync

## 5) Mint USDT Test to test users

By default deployment mints USDT to deployer. To mint more, use Hardhat console or script calling:

```solidity
USDTTest.mint(address to, uint256 amount)
```

Only owner/deployer can mint.

## 6) Buy package flow

1. Open `/shop`
2. Connect wallet on BNB testnet
3. Click **Approve USDT** for selected package
4. Click **Buy Package**
5. Tx emits `Purchase` event in `Shop`

## 7) Sync purchases into DB

Call endpoint:

```bash
curl -H "x-admin-key: <ADMIN_API_KEY>" "http://localhost:3000/api/admin/sync-purchases?fromBlock=<start>&toBlock=<end>"
```

`toBlock` optional.

## 8) Claim daily points

- Login on `/` using signed message.
- Click **Claim Daily Reward** once per UTC day.
- Reward credited = `0.5 * activeMultiplier`.

## Notes

- Production hardening still recommended (rate limit, monitoring, robust SIWE parser, background indexer job).
