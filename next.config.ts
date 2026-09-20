import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGithubPages ? "/still-app" : undefined,
  assetPrefix: isGithubPages ? "/still-app/" : undefined,
};

export default nextConfig;
