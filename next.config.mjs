/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      // Supabase Storage (shop photos)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
