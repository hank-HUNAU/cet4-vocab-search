import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // GitHub Pages: static export with basePath
  // Local dev: standalone server mode (for development only)
  output: isGitHubPages ? "export" : "standalone",
  basePath: isGitHubPages ? "/cet4-vocab-search" : "",
  assetPrefix: isGitHubPages ? "/cet4-vocab-search/" : undefined,
  // Disable trailing slash redirect for static export
  trailingSlash: isGitHubPages ? true : false,
  // Images: disable optimization for static export (no server)
  images: isGitHubPages ? { unoptimized: true } : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
