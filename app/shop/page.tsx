"use client";

import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useConnect, usePublicClient, useWriteContract } from "wagmi";
import { SiteNav } from "@/components/site-nav";
import { shopAbi, usdtAbi } from "@/lib/abi";

type PackageItem = {
  id: number;
  name: string;
  type: "SUBSCRIPTION" | "LIFETIME";
  multiplier: number;
  durationDays: number | null;
  usdtAmount: number;
};

const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}` | undefined;
const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS as `0x${string}` | undefined;

export default function ShopPage() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => setPackages(data as PackageItem[]))
      .catch(() => setStatus("Failed to load packages"));
  }, []);

  const ready = useMemo(() => Boolean(usdtAddress && shopAddress && publicClient), [publicClient]);

  async function approve(usdtAmount: number) {
    if (!usdtAddress || !shopAddress || !publicClient) return;

    try {
      setStatus("Submitting approve tx...");
      const hash = await writeContractAsync({
        abi: usdtAbi,
        address: usdtAddress,
        functionName: "approve",
        args: [shopAddress, parseUnits(usdtAmount.toString(), 18)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Approve confirmed: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Approve failed");
    }
  }

  async function buy(packageId: number) {
    if (!shopAddress || !publicClient) return;

    try {
      setStatus("Submitting buy tx...");
      const hash = await writeContractAsync({
        abi: shopAbi,
        address: shopAddress,
        functionName: "buy",
        args: [BigInt(packageId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Buy confirmed: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Buy failed");
    }
  }

  return (
    <main className="container">
      <SiteNav />
      <h1>Shop</h1>
      {!isConnected ? (
        <button
          onClick={() => {
            const connector = connectors[0];
            if (connector) connect({ connector });
          }}
        >
          Connect Wallet
        </button>
      ) : null}

      {!ready && <p>Missing NEXT_PUBLIC_USDT_ADDRESS / NEXT_PUBLIC_SHOP_ADDRESS / RPC config.</p>}

      <div className="list">
        {packages.map((pkg) => (
          <section className="card" key={pkg.id}>
            <h2>{pkg.name}</h2>
            <p>Type: {pkg.type}</p>
            <p>Multiplier: x{pkg.multiplier}</p>
            <p>Duration: {pkg.durationDays ? `${pkg.durationDays} days` : "Lifetime"}</p>
            <p>Price: {pkg.usdtAmount} USDT Test</p>
            <div className="row">
              <button disabled={!ready || !isConnected} onClick={() => void approve(pkg.usdtAmount)}>
                Approve USDT
              </button>
              <button disabled={!ready || !isConnected} onClick={() => void buy(pkg.id)}>
                Buy Package
              </button>
            </div>
          </section>
        ))}
      </div>

      {status && <p className="status">{status}</p>}
    </main>
  );
}
