export interface Contributor {
  login: string;
  commits: number;
  address: string;
}

// Phase 1 stand-in data. The logins and commit counts are made up, and the
// addresses are throwaway testnet keypairs generated for this project — they
// do NOT belong to any real GitHub contributor. Real snapshot data replaces
// this in Phase 2; real addresses only ever come from a hand-maintained
// mapping, never from guessing.
export const contributors: Contributor[] = [
  {
    login: "alice-dev",
    commits: 412,
    address: "GDUWHPWNRT6FVPWV7O43B2LEPXUQY2MXV4TSS476SGKS3POOQ5PZ4IRD",
  },
  {
    login: "bob-builds",
    commits: 187,
    address: "GBYYIY3FEHUY275DCWTAKZDR6GVQ5ESF7B67E5WKPIIB346VI6SY2Z3Y",
  },
  {
    login: "carol-codes",
    commits: 95,
    address: "GBBMUYPYOXSLCC4NTRPONMIYXKPFJ76OUKHIREM4IFII37R7BT7QEO7P",
  },
];
