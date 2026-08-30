import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is fully client-side, so it ships as a static export.
  output: "export",
  // GitHub Pages serves the site from /stellar-contrib-board.
  ...(process.env.DEPLOY_TARGET === "pages"
    ? { basePath: "/stellar-contrib-board" }
    : {}),
};

export default nextConfig;
