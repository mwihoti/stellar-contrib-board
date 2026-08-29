"use client";

import { fetchNativeBalance } from "@/lib/horizon";
import { useCallback, useEffect, useState } from "react";

export interface BalanceState {
  status: "idle" | "loading" | "funded" | "unfunded" | "error";
  /** native XLM balance, only set when status is "funded" */
  xlm: string | null;
  /** subentry count, used later for the minimum-balance check */
  subentries: number;
  /** human-readable fetch failure, only set when status is "error" */
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBalance(address: string | null): BalanceState {
  const [status, setStatus] = useState<BalanceState["status"]>("idle");
  const [xlm, setXlm] = useState<string | null>(null);
  const [subentries, setSubentries] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setStatus("loading");
    setError(null);
    try {
      const balance = await fetchNativeBalance(address);
      if (balance.status === "unfunded") {
        setStatus("unfunded");
        setXlm(null);
        setSubentries(0);
      } else {
        setStatus("funded");
        setXlm(balance.xlm);
        setSubentries(balance.subentries);
      }
    } catch (err) {
      setStatus("error");
      setXlm(null);
      setError(
        `Could not reach Horizon testnet to fetch the balance: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setStatus("idle");
      setXlm(null);
      setSubentries(0);
      setError(null);
      return;
    }
    void refresh();
  }, [address, refresh]);

  return { status, xlm, subentries, error, refresh };
}
