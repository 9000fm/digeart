import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Curator-only auth gate. Returns NextResponse if forbidden, null if allowed.
export async function requireCurator(): Promise<NextResponse | null> {
  const session = await auth();
  const curatorEmail = process.env.CURATOR_EMAIL;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!curatorEmail) {
    // Misconfigured server — fail closed
    return NextResponse.json({ error: "Curator not configured" }, { status: 503 });
  }
  if (session.user.email !== curatorEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
