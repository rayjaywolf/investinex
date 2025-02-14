import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Only protect /chat routes
    if (request.nextUrl.pathname.startsWith('/chat')) {
        // Check if the user is eligible from cookies
        const isEligible = request.cookies.get('isEligible')?.value === 'true'

        if (!isEligible) {
            // Redirect to not-eligible page
            return NextResponse.redirect(new URL('/not-eligible', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/chat', '/chat/:path*']
} 