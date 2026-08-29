"use client";

import { signTransaction } from "@stellar/freighter-api";
import { useCallback, useState } from "react";
import {
  NETWORK_PASSPHRASE,
  parseAmount,
  PayoutBlockedError,
  preparePayout,
  submitSignedTransaction,
} from "@/lib/payments";
import { describeSubmitError } from "@/lib/errors";

export type SendStatus =
  | { phase: "idle" }
  | { phase: "checking"; login: string }
  | { phase: "signing"; login: string }
  | { phase: "submitting"; login: string }
  | { phase: "success"; login: string; hash: string; createdAccount: boolean }
  | { phase: "failure"; login: string; message: string };

export interface SendPayout {
  status: SendStatus;
  /** true while a payout is somewhere between "checking" and "submitting" */
  busy: boolean;
  send: (login: string, to: string, amountInput: string) => Promise<void>;
  reset: () => void;
}

export function useSendPayout(
  from: string | null,
  onSuccess: () => void,
): SendPayout {
  const [status, setStatus] = useState<SendStatus>({ phase: "idle" });
  const busy =
    status.phase === "checking" ||
    status.phase === "signing" ||
    status.phase === "submitting";

  const send = useCallback(
    async (login: string, to: string, amountInput: string) => {
      if (!from || busy) return;
      try {
        const amount = parseAmount(amountInput);

        setStatus({ phase: "checking", login });
        const prepared = await preparePayout(from, to, amount);

        setStatus({ phase: "signing", login });
        const signed = await signTransaction(prepared.xdr, {
          networkPassphrase: NETWORK_PASSPHRASE,
          address: from,
        });
        if (signed.error) {
          setStatus({
            phase: "failure",
            login,
            message: /declin|reject|denied/i.test(signed.error.message)
              ? "You rejected the transaction in Freighter — nothing was sent."
              : `Freighter could not sign the transaction: ${signed.error.message}`,
          });
          return;
        }

        setStatus({ phase: "submitting", login });
        const hash = await submitSignedTransaction(signed.signedTxXdr);
        setStatus({
          phase: "success",
          login,
          hash,
          createdAccount: prepared.createsAccount,
        });
        onSuccess();
      } catch (err) {
        setStatus({
          phase: "failure",
          login,
          message:
            err instanceof PayoutBlockedError
              ? err.message
              : describeSubmitError(err),
        });
      }
    },
    [from, busy, onSuccess],
  );

  const reset = useCallback(() => setStatus({ phase: "idle" }), []);

  return { status, busy, send, reset };
}
