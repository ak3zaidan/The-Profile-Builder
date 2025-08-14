import { getWhopApi } from "./whopClient"

export const checkStatus = async (userId: string) => {
    const whopApi = getWhopApi();
    if (!whopApi) {
        throw { error: "Whop API not initialized", status: 500 };
    }
    if (!userId) {
        throw { error: "User ID is required", status: 400 };
    }
    const { hasAccess, accessLevel } = await whopApi.access.checkIfUserHasAccessToAccessPass({
        // The ID of the access pass
        accessPassId: process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID || "",
        userId: userId
    });
    return hasAccess
}
