"use client";

import type { BalanceState } from "@/hooks/useBalance";

export default function BalancePanel({ balance }: { balance: BalanceState }) {
  const { status, xlm, error, refresh, funding, fundingError, fund } = balance;

  if (status === "idle") return null;

  return (
    <div
      id="balance-panel"
      className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800"
    >
      {status === "loading" && (
        <p className="text-neutral-500">Fetching balance from Horizon…</p>
      )}

      {status === "funded" && (
        <div className="flex items-center justify-between gap-4">
          <p>
            Balance:{" "}
            <span className="font-mono font-medium">{xlm} XLM</span>
          </p>
          <button
            onClick={refresh}
            className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Refresh
          </button>
        </div>
      )}

      {status === "unfunded" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-amber-800 dark:text-amber-300">
              This account doesn&apos;t exist on testnet yet — Horizon has no
              record of it, which is different from a balance of 0. Friendbot
              can create it with 10,000 test XLM.
            </p>
            <button
              onClick={fund}
              disabled={funding}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {funding ? "Asking Friendbot…" : "Fund with Friendbot"}
            </button>
          </div>
          {fundingError && (
            <p className="text-red-600 dark:text-red-400">{fundingError}</p>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center justify-between gap-4 text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={refresh}
            className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
