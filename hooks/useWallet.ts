"use client";

import { isConnected } from "@stellar/freighter-api";
import { useEffect, useState } from "react";

export interface WalletState {
  /** null while the check is still in flight */
  installed: boolean | null;
}

export function useWallet(): WalletState {
  const [installed, setInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isConnected().then((res) => {
      if (cancelled) return;
      // An error here (e.g. the extension's content script failed to answer)
      // is indistinguishable from "not usable", so treat it as not installed.
      setInstalled(res.isConnected && !res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { installed };
}
