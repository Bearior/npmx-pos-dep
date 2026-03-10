import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware protects private routes and redirects unauthenticated users to /login.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isAuthPage = request.nextUrl.pathname === "/login";

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch {
    // If getUser fails (network error, invalid token, etc.), treat as unauthenticated
  }

  if (!user && !isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/pos",
    "/pos/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/orders/:path*",
    "/reports/:path*",
    "/discounts/:path*",
    "/settings/:path*",
    "/tables/:path*",
    "/kitchen/:path*",
    "/login",
  ],
};
