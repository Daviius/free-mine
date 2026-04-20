import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPackages } from "@/lib/default-packages";

const purchaseEvent = parseAbiItem(
  "event Purchase(address indexed buyer, uint256 packageId, uint256 amount, uint256 timestamp)",
);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  const incomingKey = request.headers.get("x-admin-key");

  if (adminKey && incomingKey !== adminKey) {
    return unauthorized();
  }

  const fromBlockParam = request.nextUrl.searchParams.get("fromBlock");
  const toBlockParam = request.nextUrl.searchParams.get("toBlock");

  if (!fromBlockParam) {
    return NextResponse.json({ error: "fromBlock is required" }, { status: 400 });
  }

  const fromBlock = BigInt(fromBlockParam);
  const toBlock = toBlockParam ? BigInt(toBlockParam) : "latest";

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 97);
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS as `0x${string}` | undefined;

  if (!rpcUrl || !shopAddress) {
    return NextResponse.json({ error: "Missing chain env config" }, { status: 500 });
  }

  await ensureDefaultPackages();

  const client = createPublicClient({
    transport: http(rpcUrl),
    chain: {
      id: chainId,
      name: `BNB chain ${chainId}`,
      nativeCurrency: { decimals: 18, name: "BNB", symbol: "BNB" },
      rpcUrls: { default: { http: [rpcUrl] } },
    },
  });

  const logs = await client.getLogs({
    address: shopAddress,
    event: purchaseEvent,
    fromBlock,
    toBlock,
  });

  let synced = 0;

  for (const log of logs) {
    const txHash = log.transactionHash;

    if (!txHash) {
      continue;
    }

    const exists = await prisma.purchase.findUnique({ where: { txHash } });

    if (exists) {
      continue;
    }

    const packageId = Number(log.args.packageId ?? BigInt(0));
    const purchasedAt = new Date(Number(log.args.timestamp ?? BigInt(0)) * 1000);
    const buyer = String(log.args.buyer || "").toLowerCase();
    const pkg = await prisma.miningPackage.findUnique({ where: { id: packageId } });

    if (!pkg || !buyer) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { address: buyer },
      update: {},
      create: { address: buyer },
    });

    const endsAt = pkg.durationDays
      ? new Date(purchasedAt.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.purchase.create({
      data: {
        txHash,
        blockNumber: log.blockNumber,
        userId: user.id,
        packageId,
        purchasedAt,
        startsAt: purchasedAt,
        endsAt,
      },
    });

    synced += 1;
  }

  return NextResponse.json({ synced, scanned: logs.length, fromBlock: fromBlock.toString(), toBlock: String(toBlock) });
}
