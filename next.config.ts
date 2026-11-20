import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // L'image de partage lit la police et le logo sur le disque : on force leur inclusion au déploiement.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/app/fonts/Robinco-Regular.otf", "./src/assets/kamply-wordmark-white.svg"],
    "/twitter-image": ["./src/app/fonts/Robinco-Regular.otf", "./src/assets/kamply-wordmark-white.svg"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
