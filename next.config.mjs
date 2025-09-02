import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  async headers() {
    return [
      {
        source: '/tiles/:z/:x/:y.pbf',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/vnd.mapbox-vector-tile',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
});
