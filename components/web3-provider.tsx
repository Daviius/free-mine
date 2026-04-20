"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || bscTestnet.id);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || bscTestnet.rpcUrls.default.http[0];

const chain = chainId === bscTestnet.id ? bscTestnet : { ...bscTestnet, id: chainId, name: `BNB Chain ${chainId}` };

const config = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [chain.id]: http(rpcUrl),
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
