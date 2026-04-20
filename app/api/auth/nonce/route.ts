import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = String(body?.address || "").toLowerCase();

  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const issuedAt = new Date().toISOString();

  await prisma.authNonce.upsert({
    where: { address },
    update: { nonce, expiresAt },
    create: { address, nonce, expiresAt },
  });

  const message = [
    "Free Mine Login",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");

  return NextResponse.json({ nonce, message });
}
