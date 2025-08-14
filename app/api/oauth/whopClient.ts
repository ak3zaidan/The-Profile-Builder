import { WhopServerSdk } from "@whop/api";

const whopApi = WhopServerSdk({
    appApiKey: process.env.WHOP_API_KEY!,
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || "",
  });

export function getWhopApi() {
    if (!process.env.WHOP_API_KEY || !process.env.NEXT_PUBLIC_WHOP_APP_ID) {
        throw new Error("Whop API key or app ID is not set");
    }
    
    return whopApi;
}