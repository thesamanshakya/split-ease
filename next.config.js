/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['utnfaqiodsqtxvxsprgp.supabase.co'],
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