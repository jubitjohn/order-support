"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    TicketCheck,
    PlusCircle,
    LogOut,
    X,
    Headset,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/SupportAuthProvider";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "All Tickets", href: "/tickets", icon: TicketCheck },
    { name: "New Ticket", href: "/tickets/new", icon: PlusCircle },
];

export function SupportSidebar({ isOpen, setIsOpen }) {
    const pathname = usePathname();
    const { logout, displayName, username } = useAuth();

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <aside className={cn(
                "w-64 h-screen fixed top-0 left-0 flex flex-col glass-panel z-40 border-r border-[#e2e8f0]/60 transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex items-center justify-between h-20 border-b border-[#e2e8f0]/60 px-6">
                    <div className="flex items-center gap-2.5">
                        <Headset className="w-6 h-6 text-gold-500" />
                        <h1 className="text-xl font-bold tracking-tight">Support</h1>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link key={item.name} href={item.href} onClick={() => setIsOpen && setIsOpen(false)}>
                                <div className={cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer group",
                                    isActive
                                        ? "text-gold-700 bg-gold-50/50"
                                        : "text-slate-600 hover:text-gold-600 hover:bg-gold-50/20"
                                )}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute inset-0 bg-gold-100/50 rounded-xl pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("w-5 h-5 z-10 transition-colors", isActive ? "text-gold-600" : "text-slate-400 group-hover:text-gold-500")} />
                                    <span className="z-10">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#e2e8f0]/60 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/50 rounded-xl subtle-ring">
                        <div className="w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center text-white font-bold shadow-md">
                            {(displayName || username || "S")[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{displayName || username || "Agent"}</span>
                            <span className="text-xs text-slate-500">Support Agent</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
