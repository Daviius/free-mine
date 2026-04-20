import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "free_mine_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(address: string) {
  return new SignJWT({ address: address.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const address = String(payload.address || "").toLowerCase();

  if (!address) {
    throw new Error("Invalid session payload");
  }

  return { address };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
