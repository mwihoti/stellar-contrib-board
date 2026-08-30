import { test } from "node:test";
import assert from "node:assert/strict";
import {
  minBalanceXlm,
  parseAmount,
  PayoutBlockedError,
} from "../lib/payments";
import { describeSubmitError } from "../lib/errors";
import { score } from "../lib/score";
import { truncateAddress } from "../lib/format";

function horizonError(codes: {
  transaction?: string;
  operations?: string[];
}): unknown {
  return { response: { data: { extras: { result_codes: codes } } } };
}

test("parseAmount accepts plain decimals up to 7 places", () => {
  assert.equal(parseAmount("12.5"), 12.5);
  assert.equal(parseAmount(" 3 "), 3);
  assert.equal(parseAmount("0.0000001"), 0.0000001);
});

test("parseAmount rejects malformed input", () => {
  assert.throws(() => parseAmount("abc"), PayoutBlockedError);
  assert.throws(() => parseAmount("1,5"), PayoutBlockedError);
  assert.throws(() => parseAmount("1.12345678"), PayoutBlockedError);
  assert.throws(() => parseAmount("-2"), PayoutBlockedError);
});

test("parseAmount rejects zero", () => {
  assert.throws(() => parseAmount("0"), PayoutBlockedError);
});

test("minBalanceXlm is 1 XLM base plus 0.5 per subentry", () => {
  assert.equal(minBalanceXlm(0), 1);
  assert.equal(minBalanceXlm(1), 1.5);
  assert.equal(minBalanceXlm(4), 3);
});

test("describeSubmitError maps operation result codes", () => {
  assert.match(
    describeSubmitError(
      horizonError({ transaction: "tx_failed", operations: ["op_underfunded"] }),
    ),
    /doesn't hold enough XLM/,
  );
  assert.match(
    describeSubmitError(
      horizonError({ transaction: "tx_failed", operations: ["op_low_reserve"] }),
    ),
    /at least 1 XLM/,
  );
});

test("describeSubmitError maps transaction result codes", () => {
  assert.match(
    describeSubmitError(horizonError({ transaction: "tx_bad_seq" })),
    /sequence number/,
  );
  assert.match(
    describeSubmitError(horizonError({ transaction: "tx_insufficient_fee" })),
    /fee bid was too low/,
  );
});

test("describeSubmitError surfaces unknown codes verbatim", () => {
  assert.match(
    describeSubmitError(horizonError({ transaction: "tx_weird" })),
    /tx_weird/,
  );
});

test("describeSubmitError treats missing result codes as not submitted", () => {
  assert.match(
    describeSubmitError(new Error("socket hang up")),
    /may not have been sent/,
  );
});

test("score is raw commit count", () => {
  assert.equal(score({ commits: 42 }), 42);
});

test("truncateAddress keeps both ends of the key", () => {
  assert.equal(
    truncateAddress("GDUWHPWNRT6FVPWV7O43B2LEPXUQY2MXV4TSS476SGKS3POOQ5PZ4IRD"),
    "GDUWH…Z4IRD",
  );
});
