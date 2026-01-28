import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Client Portal Routes (/portal/*)
    if (pathname.startsWith('/portal')) {
        // Allow public access to login
        if (pathname === '/portal/login') {
            return NextResponse.next();
        }

        const clientParams = request.cookies.get('client_session')?.value;
        const clientSession = clientParams ? await decrypt(clientParams) : null;

        if (!clientSession || clientSession.type !== 'client') {
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        return NextResponse.next();
    }

    // 2. Admin Routes (Everything else, excluding Public Review and Auth API)
    // Exclude Next.js internals, static files, review pages, and API auth
    const isPublicRoute =
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/review') || // Public Review Links
        pathname === '/favicon.ico';

    if (isPublicRoute) {
        return NextResponse.next();
    }

    const adminParams = request.cookies.get('session')?.value;
    const adminSession = adminParams ? await decrypt(adminParams) : null;

    // Start with strict admin check for root dashboard
    if (!adminSession?.user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
