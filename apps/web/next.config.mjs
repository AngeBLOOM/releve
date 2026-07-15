/** @type {import('next').NextConfig} */
// Tienda Relevé — proxy /api hacia el servidor de Render (Neon + Redis).
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'https://releve-api-6abw.onrender.com'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
