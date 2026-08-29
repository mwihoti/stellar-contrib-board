/**
 * Plain-English messages for the Horizon result codes this app can actually
 * hit. Anything unmapped falls through to the raw code so it is never
 * swallowed silently.
 */

const TX_CODE_MESSAGES: Record<string, string> = {
  tx_insufficient_balance:
    "The network rejected the transaction: paying this amount plus the fee would take your account below its minimum XLM reserve.",
  tx_bad_seq:
    "The transaction used a stale sequence number — usually another transaction from this account went through in the meantime. Just try the send again.",
  tx_too_late:
    "The transaction expired before it reached the ledger (it sat unsigned for too long). Start the send again.",
};

const OP_CODE_MESSAGES: Record<string, string> = {
  op_no_destination:
    "The destination account doesn't exist on testnet. (The app normally catches this and creates the account instead — it may have been merged away just now. Retry the send.)",
  op_underfunded:
    "Your account doesn't hold enough XLM above its reserve to send this amount.",
  op_low_reserve:
    "The amount is too small to create the destination account — a new account needs at least 1 XLM.",
};

interface HorizonErrorData {
  extras?: {
    result_codes?: {
      transaction?: string;
      operations?: string[];
    };
  };
}

function extractResultCodes(err: unknown) {
  if (typeof err !== "object" || err === null) return undefined;
  const response = (err as { response?: { data?: HorizonErrorData } }).response;
  return response?.data?.extras?.result_codes;
}

/** Turns a Horizon submission failure into a message fit for the UI. */
export function describeSubmitError(err: unknown): string {
  const codes = extractResultCodes(err);

  if (!codes) {
    // No result codes means the transaction never got a verdict — a network
    // failure or a non-Horizon error, which is a different situation than a
    // rejected transaction and is worded as such.
    const detail = err instanceof Error ? err.message : String(err);
    return `Could not submit the transaction to Horizon — it may not have been sent at all: ${detail}`;
  }

  const failedOp = codes.operations?.find((c) => c !== "op_success");
  if (failedOp) {
    return OP_CODE_MESSAGES[failedOp] ?? unknownCode(failedOp);
  }
  if (codes.transaction && codes.transaction !== "tx_failed") {
    return TX_CODE_MESSAGES[codes.transaction] ?? unknownCode(codes.transaction);
  }
  return unknownCode(codes.transaction ?? "tx_failed");
}

function unknownCode(code: string): string {
  return `The network rejected the transaction with code "${code}". Nothing was sent.`;
}
