"use client";

import { useState } from "react";
import type { Contributor } from "@/lib/contributors";
import type { SendPayout } from "@/hooks/useSendPayout";
import { truncateAddress } from "@/lib/format";

interface TableProps {
  contributors: Contributor[];
  payout: SendPayout;
  /** null when sending is allowed; otherwise the reason it isn't */
  sendBlocked: string | null;
}

export default function ContributorTable({
  contributors,
  payout,
  sendBlocked,
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800">
          <tr>
            <th className="px-4 py-3">Contributor</th>
            <th className="px-4 py-3">Commits</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Payout</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map((c) => (
            <ContributorRow
              key={c.login}
              contributor={c}
              payout={payout}
              sendBlocked={sendBlocked}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContributorRow({
  contributor,
  payout,
  sendBlocked,
}: {
  contributor: Contributor;
  payout: SendPayout;
  sendBlocked: string | null;
}) {
  const [amount, setAmount] = useState("");
  const { status, busy, send } = payout;
  const isThisRowPending =
    busy && "login" in status && status.login === contributor.login;

  const disabled = sendBlocked !== null || busy || amount.trim() === "";

  return (
    <tr className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
      <td className="px-4 py-3 font-medium">{contributor.login}</td>
      <td className="px-4 py-3">{contributor.commits}</td>
      <td className="px-4 py-3 font-mono" title={contributor.address}>
        {truncateAddress(contributor.address)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="XLM"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className="w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 font-mono disabled:opacity-50 dark:border-neutral-700"
          />
          <button
            onClick={() => send(contributor.login, contributor.address, amount)}
            disabled={disabled}
            title={sendBlocked ?? undefined}
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isThisRowPending ? "Sending…" : "Send"}
          </button>
        </div>
      </td>
    </tr>
  );
}
