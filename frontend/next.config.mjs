/** @type {import('next').NextConfig} */
const backendPort = process.env.BACKEND_PORT || '8000';
const backendHost = process.env.BACKEND_HOST || '127.0.0.1';

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://${backendHost}:${backendPort}/api/:path*`,
      },
      {
        source: '/docs',
        destination: `http://${backendHost}:${backendPort}/docs`,
      },
      {
        source: '/openapi.json',
        destination: `http://${backendHost}:${backendPort}/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
