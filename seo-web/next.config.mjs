/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.line-scdn.net' },
      { protocol: 'https', hostname: '**.line-apps.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.imtthailand2019.workers.dev' }
    ]
  }
};

export default nextConfig;
