import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPackages } from "@/lib/default-packages";

export async function GET() {
  await ensureDefaultPackages();

  const packages = await prisma.miningPackage.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(
    packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      multiplier: Number(pkg.multiplier),
      durationDays: pkg.durationDays,
      usdtAmount: Number(pkg.usdtAmount),
    })),
  );
}
