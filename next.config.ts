import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oavgquwjvbzrgqpoufgx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
