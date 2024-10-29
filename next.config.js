/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/franco-may.appspot.com/**",
      },
    ],
  },
  // Add CORS configuration as middleware or in API routes
  async headers() {
    return [
      {
        source: "/api/baby-name/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // TODO: replace with the app's domain
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Authorization,Content-Type",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
