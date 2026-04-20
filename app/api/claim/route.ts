import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BASE_DAILY_REWARD, getActiveMultiplier, getUtcDayStart } from "@/lib/mining";
import { requireSessionAddress } from "@/lib/auth";

export async function POST() {
  const address = await requireSessionAddress();

  if (!address) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { address } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const claimDay = getUtcDayStart();
  const multiplier = await getActiveMultiplier(user.id);
  const reward = BASE_DAILY_REWARD * multiplier;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.claim.create({
        data: {
          userId: user.id,
          claimDay,
          credited: reward,
          multiplier,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          points: {
            increment: reward,
          },
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Already claimed for current UTC day" },
        { status: 409 },
      );
    }

    throw error;
  }

  const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });

  return NextResponse.json({
    ok: true,
    credited: reward,
    multiplier,
    pointsBalance: Number(refreshedUser?.points || 0),
    claimDay,
  });
}
