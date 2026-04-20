import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/session";

export async function requireSessionAddress() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await verifySessionToken(token);
    return session.address;
  } catch {
    return null;
  }
}
