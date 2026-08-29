"use client";

import { useWallet } from "@/hooks/useWallet";
import WalletPanel from "@/components/WalletPanel";
import NetworkBanner from "@/components/NetworkBanner";

export default function Board() {
  const wallet = useWallet();

  return (
    <div className="mt-8 flex flex-col gap-6">
      <WalletPanel wallet={wallet} />
      <NetworkBanner wallet={wallet} />
    </div>
  );
}
