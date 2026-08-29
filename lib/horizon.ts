import { Horizon, NotFoundError } from "@stellar/stellar-sdk";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const horizon = new Horizon.Server(HORIZON_URL);

export type NativeBalance =
  | { status: "funded"; xlm: string; subentries: number }
  /** Horizon returned 404: the account has never been funded. Not a zero balance. */
  | { status: "unfunded" };

export async function fetchNativeBalance(
  address: string,
): Promise<NativeBalance> {
  try {
    const account = await horizon.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return {
      status: "funded",
      // Every funded account has a native balance line; the fallback only
      // guards the type narrowing.
      xlm: native?.balance ?? "0",
      subentries: account.subentry_count,
    };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { status: "unfunded" };
    }
    throw err;
  }
}

/** Asks Friendbot to create and fund the account. Throws with a readable message on failure. */
export async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(
    `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`,
  );
  if (res.ok) return;

  // Friendbot answers errors as JSON problem details; fall back to the HTTP
  // status line when the body isn't parseable JSON.
  let detail = `${res.status} ${res.statusText}`;
  const body = await res.text();
  try {
    const parsed = JSON.parse(body) as { detail?: string; title?: string };
    detail = parsed.detail ?? parsed.title ?? detail;
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
  }
  throw new Error(`Friendbot refused to fund the account: ${detail}`);
}

export async function accountExists(address: string): Promise<boolean> {
  try {
    await horizon.loadAccount(address);
    return true;
  } catch (err) {
    if (err instanceof NotFoundError) {
      return false;
    }
    throw err;
  }
}
