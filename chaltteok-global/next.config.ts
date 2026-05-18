import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['10.0.2.2', 'localhost:3000', '127.0.0.1:3000', '192.168.219.43:3000', '192.168.219.43']
};

export default nextConfig;
