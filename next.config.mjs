/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "www.themealdb.com" },
      { hostname: "img.spoonacular.com" },
    ],
  },
};

export default nextConfig;
