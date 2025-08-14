import { NextResponse } from "next/server";
import { getWhopApi } from "../whopClient";

export function GET(request: Request) {
  const whopApi = getWhopApi();
  if (!whopApi) {
    return NextResponse.json({ error: "Whop API not initialized" }, { status: 500 });
  }
  const route = new URL(request.url);
  const next = route.searchParams.get("next") ?? "/home";
  
  const { url, state } = whopApi.oauth.getAuthorizationUrl({
      redirectUri: `${process.env.FRONTEND_URL}/api/oauth/callback`,
      scope: ["read_user"],
    });

  const consentUrl = new URL(url);
  consentUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(consentUrl.toString(), 302);
  res.cookies.set({
    name: `oauth-state.${state}`,
    value: encodeURIComponent(next),
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
  });

  return res;
}