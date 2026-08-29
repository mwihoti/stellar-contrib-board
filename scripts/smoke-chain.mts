/**
 * Live testnet smoke test for the chain layer. Signs with a throwaway local
 * keypair instead of Freighter (which needs a browser); everything else is
 * the exact code the app runs. Run: npx tsx scripts/smoke-chain.mts
 */
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { fetchNativeBalance, fundWithFriendbot } from "../lib/horizon";
import {
  NETWORK_PASSPHRASE,
  parseAmount,
  PayoutBlockedError,
  preparePayout,
  submitSignedTransaction,
} from "../lib/payments";
import { describeSubmitError } from "../lib/errors";

function signLocally(xdr: string, keypair: Keypair): string {
  const tx = TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
  tx.sign(keypair);
  return tx.toXDR();
}

async function expectBlocked(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`FAIL ${label}: was not blocked`);
  } catch (err) {
    if (err instanceof PayoutBlockedError) {
      console.log(`ok   ${label}: "${err.message.slice(0, 80)}…"`);
    } else {
      console.log(`FAIL ${label}: unexpected error ${err}`);
    }
  }
}

const sender = Keypair.random();
const receiver = Keypair.random();
console.log("sender  ", sender.publicKey());
console.log("receiver", receiver.publicKey());

console.log("\n1. balance of brand-new account (expect unfunded, not zero)");
console.log("  ", await fetchNativeBalance(sender.publicKey()));

console.log("\n2. fund sender via Friendbot");
await fundWithFriendbot(sender.publicKey());
console.log("  ", await fetchNativeBalance(sender.publicKey()));

console.log("\n3. payout to nonexistent receiver (expect createAccount branch)");
const p1 = await preparePayout(sender.publicKey(), receiver.publicKey(), 5);
console.log("   createsAccount =", p1.createsAccount);
const hash1 = await submitSignedTransaction(signLocally(p1.xdr, sender));
console.log("   hash", hash1);
console.log("  ", await fetchNativeBalance(receiver.publicKey()));

console.log("\n4. payout to now-existing receiver (expect payment branch)");
const p2 = await preparePayout(sender.publicKey(), receiver.publicKey(), 2);
console.log("   createsAccount =", p2.createsAccount);
const hash2 = await submitSignedTransaction(signLocally(p2.xdr, sender));
console.log("   hash", hash2);

console.log("\n5. client-side blocks");
await expectBlocked("reserve", () =>
  preparePayout(sender.publicKey(), receiver.publicKey(), 999_999),
);
await expectBlocked("createAccount < 1 XLM", () =>
  preparePayout(sender.publicKey(), Keypair.random().publicKey(), 0.5),
);
await expectBlocked("bad amount", async () => parseAmount("abc"));
await expectBlocked("unfunded sender", () =>
  preparePayout(Keypair.random().publicKey(), receiver.publicKey(), 1),
);

console.log("\n6. tx_bad_seq mapping (submit two txs built from the same sequence)");
const a = await preparePayout(sender.publicKey(), receiver.publicKey(), 1);
const b = await preparePayout(sender.publicKey(), receiver.publicKey(), 1);
await submitSignedTransaction(signLocally(a.xdr, sender));
try {
  await submitSignedTransaction(signLocally(b.xdr, sender));
  console.log("FAIL: stale-sequence submit did not fail");
} catch (err) {
  console.log("   mapped:", describeSubmitError(err));
}

console.log("\ndone");
