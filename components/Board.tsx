"use client";

import { useWallet } from "@/hooks/useWallet";
import { useBalance } from "@/hooks/useBalance";
import WalletPanel from "@/components/WalletPanel";
import NetworkBanner from "@/components/NetworkBanner";
import BalancePanel from "@/components/BalancePanel";

export default function Board() {
  const wallet = useWallet();
  const balance = useBalance(wallet.address);

  return (
    <div className="mt-8 flex flex-col gap-6">
      <WalletPanel wallet={wallet} />
      <NetworkBanner wallet={wallet} />
      <BalancePanel balance={balance} />
    </div>
  );
}
