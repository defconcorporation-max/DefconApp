import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth'; // Ensure this path is correct alias or relative

export async function middleware(request: NextRequest) {
    // 1. Check for session cookie
    // Note: in Middleware we can't use 'cookies-next' or node imports easily sometimes, 
    // but 'next/server' cookies works, or parsing header.
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 2. Define protected/public paths
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.startsWith('/favicon.ico');

    if (isPublicAsset) {
        return NextResponse.next();
    }

    // 3. Logic
    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
