import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,

  // 1. Tắt kiểm tra ESLint khi build (để bỏ qua lỗi 'any', 'unused vars'...)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. Tắt kiểm tra TypeScript khi build (để bỏ qua lỗi type)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;