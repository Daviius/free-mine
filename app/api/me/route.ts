import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMultiplier } from "@/lib/mining";
import { requireSessionAddress } from "@/lib/auth";

export async function GET() {
  const address = await requireSessionAddress();

  if (!address) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { address },
    include: {
      claims: {
        orderBy: { claimDay: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const activeMultiplier = await getActiveMultiplier(user.id);
  const lastClaimDate = user.claims[0]?.claimDay ?? null;

  return NextResponse.json({
    address: user.address,
    pointsBalance: Number(user.points),
    activeMultiplier,
    lastClaimDate,
  });
}
