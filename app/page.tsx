"use client";

import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";

type MeResponse = {
  address: string;
  pointsBalance: number;
  activeMultiplier: number;
  lastClaimDate: string | null;
};

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loadingMe, setLoadingMe] = useState(false);

  async function fetchMe() {
    setLoadingMe(true);
    const response = await fetch("/api/me", { credentials: "include" });

    if (!response.ok) {
      setMe(null);
      setLoadingMe(false);
      return;
    }

    const data = (await response.json()) as MeResponse;
    setMe(data);
    setLoadingMe(false);
  }


  async function login() {
    if (!address) {
      return;
    }

    try {
      setStatus("Preparing message...");
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json();

      if (!nonceRes.ok) {
        throw new Error(nonceData.error || "Failed to get nonce");
      }

      setStatus("Sign message in wallet...");
      const signature = await signMessageAsync({ message: nonceData.message });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address,
          message: nonceData.message,
          signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Login failed");
      }

      setStatus("Logged in");
      await fetchMe();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMe(null);
    setStatus("Logged out");
  }

  async function claim() {
    setStatus("Claiming...");
    const response = await fetch("/api/claim", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Claim failed");
      return;
    }

    setStatus(`Claimed ${data.credited} points`);
    await fetchMe();
  }

  return (
    <main className="container">
      <SiteNav />
      <h1>Free Mine</h1>
      <p>Daily base reward: 0.5 point (UTC daily claim)</p>

      <section className="card">
        <h2>Wallet</h2>
        {!isConnected ? (
          <button
            onClick={() => {
              const connector = connectors[0];
              if (connector) connect({ connector });
            }}
            disabled={isPending || connectors.length === 0}
          >
            {isPending ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <>
            <p>Connected: {address}</p>
            <button onClick={() => disconnect()}>Disconnect Wallet</button>
          </>
        )}
      </section>

      <section className="card">
        <h2>Session</h2>
        <div className="row">
          <button onClick={login} disabled={!isConnected}>Login with Signature</button>
          <button onClick={logout}>Logout</button>
          <button onClick={() => void fetchMe()} disabled={loadingMe}>
            {loadingMe ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Account</h2>
        {me ? (
          <>
            <p>Address: {me.address}</p>
            <p>Points: {me.pointsBalance}</p>
            <p>Active Multiplier: x{me.activeMultiplier}</p>
            <p>Last Claim Date: {me.lastClaimDate ? new Date(me.lastClaimDate).toISOString().slice(0, 10) : "Never"}</p>
            <button onClick={claim}>Claim Daily Reward</button>
          </>
        ) : (
          <p>Not logged in yet.</p>
        )}
      </section>

      {status && <p className="status">{status}</p>}
    </main>
  );
}
