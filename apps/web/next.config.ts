import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // packages/shared é consumido como TS bruto (sem build step) — precisa ser transpilado pelo Next.
  transpilePackages: ['@orcamento/shared'],
};

export default nextConfig;
