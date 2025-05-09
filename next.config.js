/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utnfaqiodsqtxvxsprgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // PWA configuration
  webpack: (config) => {
    // Add support for PWA
    return config;
  },
};

module.exports = nextConfig;