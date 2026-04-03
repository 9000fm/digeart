import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  if (!req.auth) {
    if (req.nextUrl.pathname.startsWith("/api/curator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Read curator status from JWT (set once at login in auth.ts)
  const isCurator = (req.auth as unknown as { isCurator?: boolean }).isCurator;

  if (!isCurator) {
    if (req.nextUrl.pathname.startsWith("/api/curator")) {
      return NextResponse.json({ error: "Not a curator" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/curator/:path*", "/api/curator/:path*"],
};
