"use client";

import type { WalletState } from "@/hooks/useWallet";

export default function WalletPanel({ wallet }: { wallet: WalletState }) {
  const { installed } = wallet;

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

  return (
    <div className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
      Freighter detected.
    </div>
  );
}
