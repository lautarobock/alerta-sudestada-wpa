import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have types
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable caching in development for easier debugging
  ...(process.env.NODE_ENV === "development" && {
    headers: async () => {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
        },
      ];
    },
  }),
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Disable service worker in development
  sw: process.env.NODE_ENV === "development" ? undefined : "sw.js",
})(nextConfig);
