import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    const publicPaths = ["/login", "/api/auth/login", "/api/auth/check"];
    if (
        publicPaths.some(p => pathname === p || pathname.startsWith(p + "/")) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.endsWith(".ico") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".svg")
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("support_session")?.value;

    if (!token) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.SUPPORT_JWT_SECRET || "fallback-support-secret");
        const { payload } = await jwtVerify(token, secret);
        // Attach username to request headers for API routes
        const response = NextResponse.next();
        response.headers.set("x-support-user", payload.username || "");
        response.headers.set("x-support-name", payload.name || "");
        return response;
    } catch {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.set("support_session", "", { maxAge: 0, path: "/" });
        return response;
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
