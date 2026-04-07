import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req) {
    try {
        const token = req.cookies.get("support_session")?.value;
        if (!token) {
            return NextResponse.json({ authenticated: false });
        }
        const secret = new TextEncoder().encode(process.env.SUPPORT_JWT_SECRET || "fallback-support-secret");
        const { payload } = await jwtVerify(token, secret);
        return NextResponse.json({
            authenticated: true,
            username: payload.username,
            name: payload.name,
            role: payload.role,
        });
    } catch {
        return NextResponse.json({ authenticated: false });
    }
}
