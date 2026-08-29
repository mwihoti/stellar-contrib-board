import {
  Asset,
  BASE_FEE,
  Networks,
  NotFoundError,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { accountExists, horizon } from "@/lib/horizon";

export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Fee for our single-operation transactions, in XLM (BASE_FEE is in stroops). */
export const FEE_XLM = Number(BASE_FEE) / 10_000_000;

/**
 * Minimum balance the network enforces on the sender:
 * 1 XLM base reserve + 0.5 XLM per subentry.
 */
export function minBalanceXlm(subentries: number): number {
  return 1 + subentries * 0.5;
}

/**
 * A payout stopped by a client-side check, before anything was signed or
 * submitted. The message is written for the UI.
 */
export class PayoutBlockedError extends Error {}

export function parseAmount(input: string): number {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    throw new PayoutBlockedError(
      "Enter the amount as a plain number with at most 7 decimal places, e.g. 12.5.",
    );
  }
  const xlm = Number(trimmed);
  if (xlm <= 0) {
    throw new PayoutBlockedError("The amount must be greater than zero.");
  }
  return xlm;
}

export interface PreparedPayout {
  xdr: string;
  /** true when the destination doesn't exist and we create it instead of paying it */
  createsAccount: boolean;
}

export async function preparePayout(
  from: string,
  to: string,
  amountXlm: number,
): Promise<PreparedPayout> {
  let source;
  try {
    source = await horizon.loadAccount(from);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new PayoutBlockedError(
        "Your account doesn't exist on testnet yet, so it can't send anything. Fund it with Friendbot first.",
      );
    }
    throw err;
  }

  // Block sends that the network would reject with tx_insufficient_balance /
  // op_underfunded anyway — better a clear message than a failed submission.
  const native = source.balances.find((b) => b.asset_type === "native");
  const balance = Number(native?.balance ?? "0");
  const reserve = minBalanceXlm(source.subentry_count);
  const spendable = balance - reserve - FEE_XLM;
  if (amountXlm > spendable) {
    const max = Math.max(0, spendable);
    throw new PayoutBlockedError(
      `Sending ${amountXlm} XLM would drop your account below its minimum reserve. ` +
        `Your balance is ${balance} XLM; the network requires you to keep ${reserve} XLM ` +
        `(1 XLM base + 0.5 × ${source.subentry_count} subentries) plus the ${FEE_XLM} XLM fee, ` +
        `so the most you can send right now is ${max.toFixed(7)} XLM.`,
    );
  }

  // If the destination account doesn't exist, a payment would fail with
  // op_no_destination — it has to be a createAccount operation instead.
  const createsAccount = !(await accountExists(to));
  if (createsAccount && amountXlm < 1) {
    throw new PayoutBlockedError(
      "This contributor's account doesn't exist on testnet yet, so the first payout also creates it — " +
        "and a new account needs at least 1 XLM. Send 1 XLM or more.",
    );
  }

  const amount = amountXlm.toFixed(7);
  const operation = createsAccount
    ? Operation.createAccount({ destination: to, startingBalance: amount })
    : Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount,
      });

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  return { xdr: tx.toXDR(), createsAccount };
}

export async function submitSignedTransaction(
  signedXdr: string,
): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}
