import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxies the sync call to admin-web which holds the iThink API credentials.
// Set ADMIN_WEB_URL in .env.local (e.g. http://localhost:3001)
export async function POST() {
    const adminWebUrl = process.env.ADMIN_WEB_URL;
    if (!adminWebUrl) {
        return NextResponse.json(
            { success: false, error: "ADMIN_WEB_URL is not configured in .env.local" },
            { status: 500 }
        );
    }
    try {
        const res = await fetch(`${adminWebUrl}/api/sync/ithink-active`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("[Sync Proxy] Error:", error.message);
        return NextResponse.json(
            { success: false, error: "Failed to reach the sync service. Is admin-web running?" },
            { status: 502 }
        );
    }
}
