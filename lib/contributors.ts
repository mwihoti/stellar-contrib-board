import snapshot from "@/data/contributors.json";
import addressBook from "@/data/addresses.json";
import { score } from "@/lib/score";

const addresses: Record<string, string> = addressBook;

/**
 * Stellar addresses cannot be derived from GitHub identities, so the only
 * source is the hand-maintained data/addresses.json. Unmapped logins get
 * null and render as a disabled "no address on file" row.
 */
function lookupAddress(login: string): string | null {
  if (login.startsWith("__")) return null; // __-keys in the JSON are docs, not logins
  return addresses[login] ?? null;
}

export interface Contributor {
  login: string;
  /** commits across the snapshot repos, from data/contributors.json */
  commits: number;
  /** testnet G-address, or null when the contributor has no address on file */
  address: string | null;
}

/** ISO timestamp of when the committed snapshot was generated. */
export const snapshotGeneratedAt: string = snapshot.generatedAt;
export const snapshotRepos: string[] = snapshot.repos;

export const contributors: Contributor[] = snapshot.contributors
  .map((c) => ({
    login: c.login,
    commits: c.commits,
    address: lookupAddress(c.login),
  }))
  .sort((a, b) => score(b) - score(a));
