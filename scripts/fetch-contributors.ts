/**
 * Build-time snapshot of contributor commit counts across selected
 * github.com/stellar repos. Writes data/contributors.json, which is committed
 * so the app NEVER calls the GitHub API at runtime (unauthenticated GitHub is
 * 60 requests/hour per IP and would rate-limit reviewers).
 *
 * Run: npx tsx scripts/fetch-contributors.ts
 * Optional: GITHUB_TOKEN=... raises the rate limit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPOS = [
  "stellar-cli",
  "rs-soroban-sdk",
  "js-stellar-sdk",
  "soroban-examples",
  "freighter",
  "stellar-docs",
];

interface GhContributor {
  login?: string;
  contributions: number;
  type: string;
}

async function fetchRepoContributors(repo: string): Promise<GhContributor[]> {
  const all: GhContributor[] = [];
  let url: string | null =
    `https://api.github.com/repos/stellar/${repo}/contributors?per_page=100`;
  while (url) {
    const res: Response = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "stellar-contrib-board snapshot script",
        ...(process.env.GITHUB_TOKEN
          ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });
    if (res.status === 403 || res.status === 429) {
      throw new Error(
        `GitHub rate limit hit while fetching ${repo} (HTTP ${res.status}). ` +
          "Wait for the limit to reset or set GITHUB_TOKEN.",
      );
    }
    if (!res.ok) {
      throw new Error(
        `GitHub returned ${res.status} for ${repo}: ${await res.text()}`,
      );
    }
    all.push(...((await res.json()) as GhContributor[]));
    const next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return all;
}

async function main() {
  const totals = new Map<string, number>();
  for (const repo of REPOS) {
    const contributors = await fetchRepoContributors(repo);
    // The endpoint reports commit counts on the default branch as
    // "contributions". Bots (dependabot etc.) and anonymous entries are not
    // people we'd ever pay, so they stay out of the leaderboard.
    const humans = contributors.filter((c) => c.login && c.type !== "Bot");
    for (const c of humans) {
      totals.set(c.login!, (totals.get(c.login!) ?? 0) + c.contributions);
    }
    console.log(`${repo}: ${humans.length} contributors`);
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    repos: REPOS,
    contributors: [...totals.entries()]
      .map(([login, commits]) => ({ login, commits }))
      .sort((a, b) => b.commits - a.commits),
  };

  const outPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "data",
    "contributors.json",
  );
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(
    `Wrote ${snapshot.contributors.length} contributors to ${outPath} (generatedAt ${snapshot.generatedAt})`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
