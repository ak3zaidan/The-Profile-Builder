// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  // Redirect back home
  const res = NextResponse.redirect(origin, 302);

  // Remove the Whop token cookie
  res.cookies.delete("userId");

  return res;
}
