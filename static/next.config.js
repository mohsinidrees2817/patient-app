/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  assetPrefix: "/jupyterlab/default/proxy/8000", // Ensures static assets are served correctly
  basePath: "/jupyterlab/default/proxy/8000", // Ensures Next.js paths match proxy routing
};

module.exports = nextConfig;

// module.exports = nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: "export",
//   trailingSlash: true,
// };

// module.exports = nextConfig;
