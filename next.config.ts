import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Dynamic deploy on Vercel — Server Components query Supabase at request time.
  // Static export was removed when the snapshot pipeline was retired.
};

export default nextConfig;
