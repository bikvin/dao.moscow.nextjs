/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_PROTOCOL,
        hostname: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_LINK,
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
