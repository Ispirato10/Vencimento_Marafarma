import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required for Next.js to work in combination with Firebase App Hosting's preview channels.
    // The value is injected by the App Hosting build process.
    allowedNextRoots: process.env.FIREBASE_APP_HOSTING_ALLOWED_NEXT_ROOTS?.split(','),
  },
};

export default nextConfig;
