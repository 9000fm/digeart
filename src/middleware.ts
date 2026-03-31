import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  if (!req.auth) {
    if (req.nextUrl.pathname.startsWith("/api/curator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check curator allowlist
  const email = req.auth.user?.email;
  if (!email) {
    if (req.nextUrl.pathname.startsWith("/api/curator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/curators?email=eq.${encodeURIComponent(email)}&select=id`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    }
  );
  const curators = await res.json();

  if (!Array.isArray(curators) || curators.length === 0) {
    if (req.nextUrl.pathname.startsWith("/api/curator")) {
      return NextResponse.json({ error: "Not a curator" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/curator/:path*", "/api/curator/:path*"],
};
