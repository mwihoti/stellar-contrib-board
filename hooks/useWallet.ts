"use client";

import { isConnected, requestAccess } from "@stellar/freighter-api";
import { useCallback, useEffect, useState } from "react";

export interface WalletState {
  /** null while the check is still in flight */
  installed: boolean | null;
  /** G-address of the connected wallet, or null when not connected */
  address: string | null;
  connecting: boolean;
  /** human-readable reason the last connect attempt failed */
  connectError: string | null;
  connect: () => Promise<void>;
  /**
   * Clears this app's state only. Freighter has no programmatic disconnect,
   * so the site stays on the extension's allow list until the user removes it
   * in Freighter's own settings.
   */
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);
    const res = await requestAccess();
    setConnecting(false);
    if (res.error) {
      // Most common case: the user dismissed Freighter's access prompt.
      setConnectError(
        `Freighter did not grant access: ${res.error.message}. ` +
          "If you rejected the prompt by accident, click Connect again.",
      );
      return;
    }
    if (!res.address) {
      setConnectError(
        "Freighter returned no address. Unlock the extension and make sure it has at least one account, then retry.",
      );
      return;
    }
    setAddress(res.address);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnectError(null);
  }, []);

  return { installed, address, connecting, connectError, connect, disconnect };
}
