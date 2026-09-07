import type { NextConfig } from "next";

/* ThreeUI's AnimatedTopDock source imports Three.js as the bare specifier
   "three128" (its retro/glass variants only). Map it to the installed
   three@0.128.0 for both bundlers. The sable variant used on this site never
   loads that code path, so this only matters if the build tries to resolve the
   split chunk. */
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      three128: "three",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      three128: "three",
    };
    return config;
  },
};

export default nextConfig;
