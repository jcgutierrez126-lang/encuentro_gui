import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Páginas HTML — nunca cachear en browser, siempre pedir fresco al servidor
        source: "/((?!_next/static|_next/image|favicon\\.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
