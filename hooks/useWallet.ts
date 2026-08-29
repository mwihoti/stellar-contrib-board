"use client";

import {
  getNetwork,
  isConnected,
  requestAccess,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import { useCallback, useEffect, useState } from "react";

export interface WalletState {
  /** null while the check is still in flight */
  installed: boolean | null;
  /** G-address of the connected wallet, or null when not connected */
  address: string | null;
  connecting: boolean;
  /** human-readable reason the last connect attempt failed */
  connectError: string | null;
  /** Freighter's selected network name (e.g. "TESTNET", "PUBLIC"), null until read */
  network: string | null;
  /** human-readable reason the network could not be read */
  networkError: string | null;
  /** true only once we know the wallet is on Testnet */
  onTestnet: boolean;
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
  const [network, setNetwork] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

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
    if (res.error) {
      setConnecting(false);
      // Most common case: the user dismissed Freighter's access prompt.
      setConnectError(
        `Freighter did not grant access: ${res.error.message}. ` +
          "If you rejected the prompt by accident, click Connect again.",
      );
      return;
    }
    if (!res.address) {
      setConnecting(false);
      setConnectError(
        "Freighter returned no address. Unlock the extension and make sure it has at least one account, then retry.",
      );
      return;
    }

    const net = await getNetwork();
    setConnecting(false);
    if (net.error) {
      setNetworkError(
        `Could not read Freighter's selected network: ${net.error.message}. Sending is disabled until the network is known.`,
      );
    } else {
      setNetwork(net.network);
      setNetworkError(null);
    }
    setAddress(res.address);
  }, []);

  // While connected, follow account/network switches made inside Freighter.
  useEffect(() => {
    if (!address) return;
    const watcher = new WatchWalletChanges(2000);
    watcher.watch((params) => {
      if (params.error) return; // transient poll failure; keep last known state
      if (params.network) {
        setNetwork(params.network);
        setNetworkError(null);
      }
      if (params.address && params.address !== address) {
        setAddress(params.address);
      }
    });
    return () => watcher.stop();
  }, [address]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnectError(null);
    setNetwork(null);
    setNetworkError(null);
  }, []);

  return {
    installed,
    address,
    connecting,
    connectError,
    network,
    networkError,
    onTestnet: network === "TESTNET",
    connect,
    disconnect,
  };
}
