
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
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Find the rule for image assets
    const imageRule = config.module.rules.find(
      (rule) =>
        typeof rule === 'object' &&
        rule !== null &&
        'test' in rule &&
        rule.test instanceof RegExp &&
        rule.test.test('.svg') &&
        !rule.oneOf
    );

    if (imageRule && typeof imageRule === 'object' && imageRule !== null) {
      // Exclude .ico files from this rule
      imageRule.exclude = /\.ico$/;
    }

    // Add a new rule for .ico files to be handled as static assets
    config.module.rules.push({
      test: /\.ico$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            publicPath: '/',
            outputPath: '/',
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
