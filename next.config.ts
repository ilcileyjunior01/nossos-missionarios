import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ktlvqmaacsaqffyyiujz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack(config) {
    // Necessário para @imgly/background-removal (ONNX WASM + WebGPU)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'onnxruntime-web/webgpu': false,
    }
    return config
  },
};

export default nextConfig;
