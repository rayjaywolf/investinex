/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "static.jup.ag",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
      {
        protocol: "https",
        hostname: "www.arweave.net",
      },
      {
        protocol: "https",
        hostname: "gateway.irys.xyz",
      },
      {
        protocol: "https",
        hostname: "metadata.degods.com",
      },
      {
        protocol: "https",
        hostname: "cdn.helius.xyz",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "img.helius.xyz",
      },
      {
        protocol: "https",
        hostname: "nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      {
        protocol: "https",
        hostname: "shdw-drive.genesysgo.net",
      },
      {
        protocol: "https",
        hostname: "bafybeie3hbhcyxnlvicipkesrmouu7rqrqp7qvvaxglibyibfa7sjzv2ry.ipfs.nftstorage.link",
      }
    ],
  },
};

export default nextConfig;
