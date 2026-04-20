import { PackageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const defaultPackages = [
  {
    id: 1,
    name: "Starter 7D x2",
    type: PackageType.SUBSCRIPTION,
    multiplier: "2",
    durationDays: 7,
    usdtAmount: "10",
  },
  {
    id: 2,
    name: "Pro 30D x3",
    type: PackageType.SUBSCRIPTION,
    multiplier: "3",
    durationDays: 30,
    usdtAmount: "30",
  },
  {
    id: 3,
    name: "Lifetime x2",
    type: PackageType.LIFETIME,
    multiplier: "2",
    durationDays: null,
    usdtAmount: "100",
  },
  {
    id: 4,
    name: "Lifetime x5",
    type: PackageType.LIFETIME,
    multiplier: "5",
    durationDays: null,
    usdtAmount: "250",
  },
] as const;

export async function ensureDefaultPackages() {
  await Promise.all(
    defaultPackages.map((pkg) =>
      prisma.miningPackage.upsert({
        where: { id: pkg.id },
        update: {
          name: pkg.name,
          type: pkg.type,
          multiplier: pkg.multiplier,
          durationDays: pkg.durationDays,
          usdtAmount: pkg.usdtAmount,
          isActive: true,
        },
        create: {
          id: pkg.id,
          name: pkg.name,
          type: pkg.type,
          multiplier: pkg.multiplier,
          durationDays: pkg.durationDays,
          usdtAmount: pkg.usdtAmount,
          isActive: true,
        },
      }),
    ),
  );
}
