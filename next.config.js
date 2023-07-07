/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        // pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/franco-may.appspot.com/**",
      },
    ],
  },
};

module.exports = nextConfig;
