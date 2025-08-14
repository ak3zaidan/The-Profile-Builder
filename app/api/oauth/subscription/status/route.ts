import { NextResponse } from "next/server";
import { checkStatus } from "../../utils";
import { cookies } from "next/headers";


export async function GET() {
    try {
        const cookieStore = cookies();
        const status = await checkStatus(cookieStore.get("userId")?.value || "");
        return NextResponse.json({ subscribed: status });
    } catch (err) {
        return NextResponse.json({ subscribed: false });
    }
}
