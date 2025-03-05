/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export
  trailingSlash: true, // Required for some static hosting environments
};

module.exports = nextConfig;
