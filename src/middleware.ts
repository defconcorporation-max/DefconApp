import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role;
    const { nextUrl } = req;

    const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
    const isPublicRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/portal/login' || nextUrl.pathname.startsWith('/review'); // Public review pages
    const isPortalRoute = nextUrl.pathname.startsWith('/portal');
    const isFinanceRoute = nextUrl.pathname.startsWith('/finance');
    const isSettingsRoute = nextUrl.pathname.startsWith('/settings');

    // 1. API Auth Routes - Always allow
    if (isApiAuthRoute) {
        return NextResponse.next();
    }

    // 2. Redirect unauthenticated users to login
    if (!isLoggedIn && !isPublicRoute) {
        // If trying to access portal, send to portal login
        if (isPortalRoute) {
            return NextResponse.redirect(new URL('/portal/login', nextUrl));
        }
        return NextResponse.redirect(new URL('/login', nextUrl));
    }

    // 3. Redirect authenticated users away from login pages
    if (isLoggedIn && isPublicRoute) {
        // If Client, send to Portal
        if (userRole === 'Client') {
            return NextResponse.redirect(new URL('/portal', nextUrl));
        }
        // If Team/Admin, send to Dashboard
        return NextResponse.redirect(new URL('/', nextUrl));
    }

    // 4. Role-Based Access Control (RBAC)

    // CLIENTS -> Only Portal & Review
    if (isLoggedIn && userRole === 'Client') {
        if (!isPortalRoute && !nextUrl.pathname.startsWith('/review')) {
            return NextResponse.redirect(new URL('/portal', nextUrl));
        }
    }

    // TEAM / AGENCY TEAM -> No Finance, No Settings
    if (isLoggedIn && (userRole === 'Team' || userRole === 'AgencyTeam')) {
        if (isFinanceRoute || isSettingsRoute) {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // AGENCY ADMIN -> No Finance (unless upgraded?), Settings OK?
    // User Implementation Plan says "Agency Admin: Cannot see financial data unless promoted".
    if (isLoggedIn && userRole === 'AgencyAdmin') {
        if (isFinanceRoute) {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // ADMIN -> Access All

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
