/**
 * The single place the leaderboard ranking is defined. Raw commit count for
 * now; swap this function's body when a better formula lands.
 */
export function score(c: { commits: number }): number {
  return c.commits;
}
