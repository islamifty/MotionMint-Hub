
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
      {
        protocol: 'https',
        hostname: 'mydrive.motionmint.top',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'motionmint.top',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
