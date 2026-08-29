"use client";

import { useWallet } from "@/hooks/useWallet";
import { useBalance } from "@/hooks/useBalance";
import { useSendPayout } from "@/hooks/useSendPayout";
import { contributors } from "@/lib/contributors";
import WalletPanel from "@/components/WalletPanel";
import NetworkBanner from "@/components/NetworkBanner";
import BalancePanel from "@/components/BalancePanel";
import ContributorTable from "@/components/ContributorTable";
import TxStatusPanel from "@/components/TxStatusPanel";

export default function Board() {
  const wallet = useWallet();
  const balance = useBalance(wallet.address);
  const payout = useSendPayout(wallet.address, balance.refresh);

  const sendBlocked = !wallet.address
    ? "Connect your Freighter wallet to send payouts."
    : !wallet.onTestnet
      ? "Sending is disabled while Freighter is not on Testnet."
      : balance.status === "unfunded"
        ? "Your account is unfunded — use Friendbot first."
        : balance.status !== "funded"
          ? "Waiting for your balance to load."
          : null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <WalletPanel wallet={wallet} />
      <NetworkBanner wallet={wallet} />
      <BalancePanel balance={balance} />
      <ContributorTable
        contributors={contributors}
        payout={payout}
        sendBlocked={sendBlocked}
      />
      <TxStatusPanel payout={payout} />
    </div>
  );
}
