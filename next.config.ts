import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly expose environment variables to client
  // This ensures NEXT_PUBLIC_ vars are available in client components
  env: {
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '',
    NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '',
    NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
  },
};

export default nextConfig;
