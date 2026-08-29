"use client";

import type { WalletState } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/format";

export default function WalletPanel({ wallet }: { wallet: WalletState }) {
  const { installed, address, connecting, connectError, connect, disconnect } =
    wallet;

  if (installed === null) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        Checking for the Freighter extension…
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">Freighter not detected</p>
        <p className="mt-1">
          This app needs the Freighter browser extension to connect a wallet.{" "}
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Install Freighter
          </a>
          , then reload this page.
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-500">Freighter detected.</span>
          <button
            onClick={connect}
            disabled={connecting}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {connecting ? "Waiting for Freighter…" : "Connect wallet"}
          </button>
        </div>
        {connectError && (
          <p className="text-red-600 dark:text-red-400">{connectError}</p>
        )}
      </div>
    );
  }

  return (
    <div
      id="wallet-panel"
      className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800"
    >
      <span title={address} className="font-mono">
        {truncateAddress(address)}
      </span>
      <button
        onClick={disconnect}
        title="Forgets the address in this app only. Freighter has no programmatic disconnect — to revoke access, remove this site in Freighter's settings."
        className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Disconnect
      </button>
    </div>
  );
}
