/**
 * Captures the README screenshots by driving the real app in Chromium with a
 * stub wallet: a page script answers @stellar/freighter-api's postMessage
 * protocol the way the Freighter content script would, signing with a
 * throwaway testnet keypair. The app code is completely unaware of this —
 * every state captured is a real state, and the payout is a real testnet
 * transaction (the extension popup itself is the only thing not shown, since
 * it cannot run headless).
 *
 * Temporarily maps the top contributor login to a throwaway test address in
 * data/addresses.json so one row is enabled, and restores the file afterwards.
 *
 * Run: npx tsx scripts/screenshots.mts   (needs chromium; set CHROME_PATH to override)
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { fundWithFriendbot } from "../lib/horizon";
import { NETWORK_PASSPHRASE } from "../lib/payments";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "screenshots");
const ADDRESSES = join(ROOT, "data", "addresses.json");
const PORT = 3999;

function stubWalletScript(publicKey: string): string {
  // Constants and payload shapes from @stellar/freighter-api's
  // extensionMessaging.ts / external.ts ("messagedId" typo included).
  return `
    window.freighter = true;
    window.addEventListener("message", async (ev) => {
      const d = ev.data;
      if (!d || d.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;
      const reply = (payload) =>
        window.postMessage(
          { source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", messagedId: d.messageId, ...payload },
          window.location.origin,
        );
      switch (d.type) {
        case "REQUEST_CONNECTION_STATUS":
          reply({ isConnected: true });
          break;
        case "REQUEST_ACCESS":
        case "REQUEST_PUBLIC_KEY":
          reply({ publicKey: ${JSON.stringify(publicKey)} });
          break;
        case "REQUEST_NETWORK_DETAILS":
          reply({
            networkDetails: {
              network: "TESTNET",
              networkName: "Test Net",
              networkUrl: "https://horizon-testnet.stellar.org",
              networkPassphrase: "Test SDF Network ; September 2015",
            },
          });
          break;
        case "SUBMIT_TRANSACTION":
          reply(await window.__signTx(d.transactionXdr));
          break;
      }
    });
  `;
}

async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet; keep polling
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`dev server did not come up at ${url}`);
}

async function main() {
  const sender = Keypair.random();
  const receiver = Keypair.random();
  console.log("funding sender + receiver via Friendbot…");
  await Promise.all([
    fundWithFriendbot(sender.publicKey()),
    fundWithFriendbot(receiver.publicKey()),
  ]);

  const savedAddresses = readFileSync(ADDRESSES, "utf8");
  const snapshot = JSON.parse(
    readFileSync(join(ROOT, "data", "contributors.json"), "utf8"),
  ) as { contributors: { login: string }[] };
  const topLogin = snapshot.contributors[0].login;
  writeFileSync(
    ADDRESSES,
    JSON.stringify(
      { ...JSON.parse(savedAddresses), [topLogin]: receiver.publicKey() },
      null,
      2,
    ),
  );
  console.log(`temporarily mapped ${topLogin} -> throwaway test address`);

  const server = spawn("npx", ["next", "dev", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: "ignore",
  });
  try {
    await waitForServer(`http://localhost:${PORT}`);

    const browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH ?? "/usr/bin/chromium",
      headless: true,
    });
    const page = await browser.newPage({
      viewport: { width: 1000, height: 800 },
      colorScheme: "light",
    });
    await page.exposeFunction("__signTx", (xdr: string) => {
      const tx = TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
      tx.sign(sender);
      return {
        signedTransaction: tx.toXDR(),
        signerAddress: sender.publicKey(),
      };
    });
    await page.addInitScript(stubWalletScript(sender.publicKey()));

    mkdirSync(OUT, { recursive: true });
    await page.goto(`http://localhost:${PORT}`);

    await page.getByRole("button", { name: "Connect wallet" }).click();
    await page.getByRole("button", { name: "Disconnect" }).waitFor();
    await page.locator("#wallet-panel").screenshot({
      path: join(OUT, "01-connected.png"),
    });

    await page.getByText("Balance:").waitFor();
    await page.locator("#balance-panel").screenshot({
      path: join(OUT, "02-balance.png"),
    });

    const row = page.locator("tr", { hasText: topLogin }).first();
    await row.getByPlaceholder("XLM").fill("25");
    await row.getByRole("button", { name: "Send" }).click();
    await page.getByText("confirmed").waitFor({ timeout: 60_000 });
    await page.screenshot({ path: join(OUT, "03-success.png") });
    console.log(
      "payout tx:",
      await page.locator("#tx-status a").getAttribute("href"),
    );

    await page.locator("#tx-status").getByRole("button", { name: "Dismiss" }).click();
    await row.getByPlaceholder("XLM").fill("999999");
    await row.getByRole("button", { name: "Send" }).click();
    await page.getByText("failed").waitFor({ timeout: 60_000 });
    await page.locator("#tx-status").screenshot({
      path: join(OUT, "04-blocked-reserve.png"),
    });

    await browser.close();
    console.log(`screenshots written to ${OUT}`);
  } finally {
    server.kill();
    writeFileSync(ADDRESSES, savedAddresses);
    console.log("restored data/addresses.json");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});
