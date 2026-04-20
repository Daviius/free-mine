import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieName } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = String(body?.address || "").toLowerCase();
  const signature = String(body?.signature || "");
  const message = String(body?.message || "");

  if (!address || !signature || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const nonceRecord = await prisma.authNonce.findUnique({ where: { address } });

  if (!nonceRecord || nonceRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Nonce expired" }, { status: 401 });
  }

  if (!message.includes(`Address: ${address}`) || !message.includes(`Nonce: ${nonceRecord.nonce}`)) {
    return NextResponse.json({ error: "Invalid message" }, { status: 401 });
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await prisma.user.upsert({
    where: { address },
    update: {},
    create: { address },
  });

  await prisma.authNonce.delete({ where: { address } });

  const token = await createSessionToken(address);
  const response = NextResponse.json({ ok: true, address });

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
