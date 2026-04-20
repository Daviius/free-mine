import { PackageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BASE_DAILY_REWARD = 0.5;

export function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getActiveMultiplier(userId: string, at = new Date()) {
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    include: { pkg: true },
  });

  let lifetimeMax = 1;
  let subscriptionMax = 1;

  for (const purchase of purchases) {
    const value = Number(purchase.pkg.multiplier);

    if (purchase.pkg.type === PackageType.LIFETIME) {
      lifetimeMax = Math.max(lifetimeMax, value);
      continue;
    }

    if (purchase.endsAt && purchase.startsAt <= at && purchase.endsAt >= at) {
      subscriptionMax = Math.max(subscriptionMax, value);
    }
  }

  return Math.max(1, lifetimeMax, subscriptionMax);
}
