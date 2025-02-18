import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Always allow access to chat routes
    return NextResponse.next()
}

export const config = {
    matcher: ['/chat', '/chat/:path*']
} 