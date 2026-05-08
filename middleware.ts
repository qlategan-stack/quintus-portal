import type { NextRequest } from 'next/server';
import { updateSession } from '@/app/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on every path EXCEPT:
    //   _next/static, _next/image, favicon, common image extensions
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
