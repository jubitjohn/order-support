"use client";

import { useState } from "react";
import { useAuth } from "@/components/SupportAuthProvider";
import { SupportSidebar } from "@/components/SupportSidebar";
import { usePathname } from "next/navigation";
import { Loader2, Menu, Headset } from "lucide-react";

export function SupportShell({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (pathname === "/login") {
        return children;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <SupportSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Headset className="w-5 h-5 text-gold-500" />
                    <h1 className="text-lg font-bold tracking-tight">Support</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
            <main className="flex-1 md:ml-64 min-h-screen pt-20 md:pt-4 pb-12 px-4 md:px-8 max-w-full overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="page-enter-active">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
