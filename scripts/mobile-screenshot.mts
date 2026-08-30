/**
 * Captures the mobile-viewport screenshot against the live deployment, using
 * the same wallet stub as screenshots.mts (no signing — it only connects and
 * reads the balance, with a fresh Friendbot-funded keypair).
 *
 * Run: npx tsx scripts/mobile-screenshot.mts
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { Keypair } from "@stellar/stellar-sdk";
import { fundWithFriendbot } from "../lib/horizon";

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "screenshots",
  "05-mobile.png",
);

const wallet = Keypair.random();
await fundWithFriendbot(wallet.publicKey());

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/chromium",
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  colorScheme: "light",
});
await page.addInitScript(`
  window.freighter = true;
  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (!d || d.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;
    const reply = (payload) =>
      window.postMessage(
        { source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", messagedId: d.messageId, ...payload },
        window.location.origin,
      );
    if (d.type === "REQUEST_CONNECTION_STATUS") reply({ isConnected: true });
    if (d.type === "REQUEST_ACCESS" || d.type === "REQUEST_PUBLIC_KEY")
      reply({ publicKey: ${JSON.stringify(wallet.publicKey())} });
    if (d.type === "REQUEST_NETWORK_DETAILS")
      reply({
        networkDetails: {
          network: "TESTNET",
          networkName: "Test Net",
          networkUrl: "https://horizon-testnet.stellar.org",
          networkPassphrase: "Test SDF Network ; September 2015",
        },
      });
  });
`);

await page.goto("https://mwihoti.github.io/stellar-contrib-board/");
await page.getByRole("button", { name: "Connect wallet" }).click();
await page.getByText("Balance:").waitFor();
await page.screenshot({ path: OUT });
await browser.close();
console.log(`wrote ${OUT}`);
