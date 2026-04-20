"use client";

import { useState } from "react";
import { SiteNav } from "@/components/site-nav";

export default function AdminPage() {
  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [result, setResult] = useState("");

  async function sync() {
    const params = new URLSearchParams({ fromBlock });
    if (toBlock) params.set("toBlock", toBlock);

    const response = await fetch(`/api/admin/sync-purchases?${params.toString()}`, {
      headers: adminKey ? { "x-admin-key": adminKey } : {},
    });
    const data = await response.json();

    if (!response.ok) {
      setResult(data.error || "Sync failed");
      return;
    }

    setResult(JSON.stringify(data));
  }

  return (
    <main className="container">
      <SiteNav />
      <h1>Admin Sync</h1>

      <section className="card">
        <label>
          From block
          <input value={fromBlock} onChange={(e) => setFromBlock(e.target.value)} placeholder="e.g. 50000000" />
        </label>
        <label>
          To block (optional)
          <input value={toBlock} onChange={(e) => setToBlock(e.target.value)} placeholder="latest if empty" />
        </label>
        <label>
          Admin key (optional)
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        </label>
        <button onClick={sync} disabled={!fromBlock}>Sync Purchases</button>
      </section>

      {result && <p className="status">{result}</p>}
    </main>
  );
}
