"use client";

import { fetchNativeBalance, fundWithFriendbot } from "@/lib/horizon";
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
  funding: boolean;
  /** human-readable Friendbot failure */
  fundingError: string | null;
  fund: () => Promise<void>;
}

export function useBalance(address: string | null): BalanceState {
  const [status, setStatus] = useState<BalanceState["status"]>("idle");
  const [xlm, setXlm] = useState<string | null>(null);
  const [subentries, setSubentries] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);

  // Reset everything when the wallet address changes (connect, disconnect,
  // or account switch inside Freighter), before the next fetch lands.
  const [prevAddress, setPrevAddress] = useState<string | null>(address);
  if (prevAddress !== address) {
    setPrevAddress(address);
    setStatus(address ? "loading" : "idle");
    setXlm(null);
    setSubentries(0);
    setError(null);
    setFundingError(null);
  }

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

  const fund = useCallback(async () => {
    if (!address) return;
    setFunding(true);
    setFundingError(null);
    try {
      await fundWithFriendbot(address);
      await refresh();
    } catch (err) {
      setFundingError(err instanceof Error ? err.message : String(err));
    } finally {
      setFunding(false);
    }
  }, [address, refresh]);

  useEffect(() => {
    if (address) void refresh();
  }, [address, refresh]);

  return { status, xlm, subentries, error, refresh, funding, fundingError, fund };
}
