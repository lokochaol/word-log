import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a pending navigation, prefetch, or Server Action (e.g. creating a
  // 走り書き while offline — see OfflineAddQuickNote) sit and retry instead
  // of throwing when the network drops, resolving automatically once
  // connectivity returns. See src/app/scratch for how this is used.
  experimental: {
    useOffline: true,
  },
};

export default nextConfig;
