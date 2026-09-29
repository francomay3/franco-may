// next.config.js
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  experimental: { optimizePackageImports: ['@mantine/core', '@mantine/hooks'] },
  // The search route reads these with readdir/readFile, which the tracer
  // does not follow. Without this the deployed function has no texts.
  outputFileTracingIncludes: {
    '/api/fornlamningar/search': [
      './data/descriptions.en.db',
      './data/lamning-index.txt.gz',
      './public/descriptions/**/*',
    ],
    '/api/fornlamningar/places': [
      './data/descriptions.en.db',
      './public/descriptions/**/*',
      './public/tiles/14/**/*',
    ],
  },

  async headers() {
    return [
      {
        // be flexible: allow all nested paths under /tiles
        source: '/tiles/:path*',
        headers: [
          // let the platform decide on compression; do NOT set Content-Encoding
          { key: 'Content-Type', value: 'application/vnd.mapbox-vector-tile' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },

          // CORS
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Origin, Range, Content-Type, Accept, Accept-Encoding',
          },

          // ensure correct variant caching when brotli/gzip is applied by the host
          { key: 'Vary', value: 'Accept-Encoding' },
          // optional but sometimes helpful with strict COOP/CORP setups
          // { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
});
