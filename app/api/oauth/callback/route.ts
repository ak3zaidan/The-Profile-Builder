import { NextRequest, NextResponse } from "next/server";
import { getWhopApi } from "../whopClient";
import { checkStatus } from "../utils";

export async function GET(req: NextRequest) {
  const whopApi = getWhopApi();
  const url = new URL(req.url);
  const origin = url.origin;             // e.g. "http://localhost:3000"
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    const missing = !code ? "code" : "state";
    return NextResponse.redirect(
      `${origin}/oauth/error?error=missing_${missing}`,
      302
    );
  }

  const stateCookie = req.cookies.get(`oauth-state.${state}`);
  if (!stateCookie) {
    return NextResponse.redirect(
      `${origin}/oauth/error?error=invalid_state`,
      302
    );
  }

  const auth = await whopApi.oauth.exchangeCode({
    code,
    redirectUri: `${origin}/api/oauth/callback`,
  });
  if (!auth.ok) {
    return NextResponse.redirect(
      `${origin}/oauth/error?error=code_exchange_failed`,
      302
    );
  }

  const nextPath = decodeURIComponent(stateCookie.value);
  const destination = new URL(nextPath, origin);
  const { userId } = await whopApi.verifyUserToken(auth.tokens.access_token);
  const status = await checkStatus(userId);
  let res;
  if (!status) {
    res = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_WHOP_CHECKOUT_LINK}`,
      302
    );
  } else {
    res = NextResponse.redirect(destination.toString(), 302);
  }
  res.cookies.set({
    name: "userId",
    value: userId,
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  res.cookies.delete(`oauth-state.${state}`);
  return res;
}
