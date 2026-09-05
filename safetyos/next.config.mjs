import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is independent of the static Safex package one directory above.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};

export default nextConfig;
