import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (!url || !key) {
    if (isLogin) return NextResponse.next();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("next", path);
    return copyCookies(response, NextResponse.redirect(redirectUrl));
  }

  if (user) {
    const { data } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!data && !isLogin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("error", "unauthorized");
      return copyCookies(response, NextResponse.redirect(redirectUrl));
    }
    if (data && isLogin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/dashboard";
      redirectUrl.search = "";
      return copyCookies(response, NextResponse.redirect(redirectUrl));
    }
  }

  return response;
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
  return target;
}

export const config = {
  matcher: ["/admin/:path*"],
};
