import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Remove any existing frame-blocking headers
  response.headers.delete('X-Frame-Options');
  
  // Set headers to allow iframe embedding from any domain
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Content-Security-Policy', 'frame-ancestors *');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  console.log(`Setting iframe headers for: ${request.url}`);
  
  return response;
}

export const config = {
  matcher: '/(.*)',
}; 