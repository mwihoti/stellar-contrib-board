import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stellar-contrib-board",
  description:
    "Leaderboard of stellar-org contributors with manual XLM payouts on testnet",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
