import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Файл импорта задач и картинки для задач - до 5 МБ (по умолчанию 1 МБ)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
