import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionCookie } from "@/lib/auth/session";

const SESSION_COOKIE_NAME = "__session";
const VERIFY_TIMEOUT_MS = 8_000;

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/payment-attempt",
  "/payment-success",
  "/profile",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/signin", "/signup", "/forgot-password"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

async function hasValidSession(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) return false;
  try {
    const verified = await Promise.race([
      verifySessionCookie(sessionCookie),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), VERIFY_TIMEOUT_MS);
      }),
    ]);
    return Boolean(verified);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const needsSessionCheck =
    isProtectedRoute(pathname) || (isAuthRoute(pathname) && Boolean(sessionCookie));
  const sessionValid = needsSessionCheck
    ? await hasValidSession(sessionCookie)
    : false;

  if (isProtectedRoute(pathname) && !sessionValid) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signinUrl);
  }

  if (isAuthRoute(pathname) && sessionValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes
    "/((?!_next|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
