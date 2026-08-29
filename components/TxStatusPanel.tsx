"use client";

import type { SendPayout } from "@/hooks/useSendPayout";

const EXPLORER_TX_URL = "https://stellar.expert/explorer/testnet/tx";

export default function TxStatusPanel({ payout }: { payout: SendPayout }) {
  const { status, reset } = payout;

  if (status.phase === "idle") return null;

  if (
    status.phase === "checking" ||
    status.phase === "signing" ||
    status.phase === "submitting"
  ) {
    const text = {
      checking: `Checking your account and ${status.login}'s account on Horizon…`,
      signing:
        "Waiting for you to review and sign the transaction in Freighter…",
      submitting: "Submitting the signed transaction to Horizon…",
    }[status.phase];
    return (
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
        />
        <p>{text}</p>
      </div>
    );
  }

  if (status.phase === "success") {
    return (
      <div
        id="tx-status"
        className="flex items-start justify-between gap-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        <div>
          <p className="font-medium">Payout to {status.login} confirmed</p>
          {status.createdAccount && (
            <p className="mt-1">
              Their account didn&apos;t exist yet, so this payout also created
              it.
            </p>
          )}
          <p className="mt-1">
            Transaction{" "}
            <a
              href={`${EXPLORER_TX_URL}/${status.hash}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono underline"
            >
              {status.hash.slice(0, 8)}…{status.hash.slice(-8)}
            </a>{" "}
            on stellar.expert
          </p>
        </div>
        <DismissButton onClick={reset} />
      </div>
    );
  }

  return (
    <div
      id="tx-status"
      className="flex items-start justify-between gap-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      <div>
        <p className="font-medium">Payout to {status.login} failed</p>
        <p className="mt-1">{status.message}</p>
      </div>
      <DismissButton onClick={reset} />
    </div>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-md border border-current/30 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
    >
      Dismiss
    </button>
  );
}
