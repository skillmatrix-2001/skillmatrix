/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

    // Prevents Next.js/Turbopack from bundling Node-only packages
  serverExternalPackages: ['pdfmake'],
  
  // Optional: Configure image domains if you'll be using external images
  images: {
    domains: ['localhost'],
    // If you're storing images locally or on a CDN, add those domains here
  },
  
  // Optional: Environment variables that should be available on the client
  env: {
    APP_NAME: 'SkillMatrix',
    APP_DESCRIPTION: 'College Social Platform for Achievements and Portfolios',
  },
  
  // Optional: Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/',
        destination: '/feed',
        permanent: false,
      },
    ]
  },
  
  // Optional: Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  }
}

export default nextConfig