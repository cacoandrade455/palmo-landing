import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js ignores the stray
  // package-lock.json in C:\Users\User and stops warning about it.
  turbopack: {
    root: path.join(__dirname),
  },
  // URLs limpas do marketplace público: as rotas antigas do app redirecionam
  // permanentemente (308) — links já compartilhados continuam funcionando.
  async redirects() {
    return [
      {
        source: "/app/explorar",
        destination: "/explorar",
        permanent: true,
      },
      {
        source: "/app/imovel/:id",
        destination: "/terra/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
