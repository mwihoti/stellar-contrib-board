"use client";

import type { WalletState } from "@/hooks/useWallet";

/**
 * Blocking banner shown while the connected wallet is not on Testnet.
 * We deliberately do not try to switch the network for the user.
 */
export default function NetworkBanner({ wallet }: { wallet: WalletState }) {
  const { address, network, networkError, onTestnet } = wallet;

  if (!address || onTestnet) return null;

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <p className="font-medium">Wrong network — sending is disabled</p>
      <p className="mt-1">
        {networkError ??
          `Freighter is set to ${network ?? "an unknown network"}, but this app only works on Testnet. ` +
            "Open the Freighter extension and switch the network to Test Net, then come back — this banner will clear on its own."}
      </p>
    </div>
  );
}
