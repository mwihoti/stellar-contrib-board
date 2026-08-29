import snapshot from "@/data/contributors.json";
import { score } from "@/lib/score";

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
  .map((c) => ({ login: c.login, commits: c.commits, address: null }))
  .sort((a, b) => score(b) - score(a));
