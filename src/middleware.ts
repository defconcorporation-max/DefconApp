import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth-utils';

export async function middleware(request: NextRequest) {
    // 1. Check for session cookie
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 2. Define protected/public paths
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.startsWith('/favicon.ico') ||
        request.nextUrl.pathname.startsWith('/health') ||
        request.nextUrl.pathname.endsWith('.txt'); // Allow health check files

    if (isPublicAsset) {
        return NextResponse.next();
    }

    // 3. Logic
    // if (!session && !isLoginPage) {
    //    return NextResponse.redirect(new URL('/login', request.url));
    // }

    // if (session && isLoginPage) {
    //    return NextResponse.redirect(new URL('/', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
