import { NextResponse } from "next/server";
import { SignJWT } from "jose";

function getSupportUsers() {
    try {
        const raw = process.env.SUPPORT_USERS || '[]';
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function POST(req) {
    try {
        const { username, password } = await req.json();
        const users = getSupportUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 401 }
            );
        }

        const secret = new TextEncoder().encode(process.env.SUPPORT_JWT_SECRET || "fallback-support-secret");
        const token = await new SignJWT({ username: user.username, name: user.name, role: "support" })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secret);

        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            username: user.username,
            name: user.name,
        });

        response.cookies.set("support_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.set("support_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
    return response;
}
