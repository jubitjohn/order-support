"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/SupportAuthProvider";
import {
    Loader2,
    Headset,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowRight,
    Plus,
    TicketCheck,
    TrendingUp,
} from "lucide-react";

function KpiCard({ icon: Icon, label, value, color, sub }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 flex items-start gap-4"
        >
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
}

export default function SupportDashboard() {
    const router = useRouter();
    const { displayName, username } = useAuth();
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, ticketsRes] = await Promise.all([
                    fetch("/api/tickets/stats"),
                    fetch("/api/tickets"),
                ]);
                const statsData = await statsRes.json();
                const ticketsData = await ticketsRes.json();
                if (statsData.success) setStats(statsData.data);
                if (ticketsData.success) {
                    // Filter tickets assigned to this agent (match by username or display name)
                    const myTickets = ticketsData.data.filter(t => {
                        const assigned = (t.Assigned_To || "").toLowerCase();
                        return assigned.includes((username || "").toLowerCase()) ||
                               assigned.includes((displayName || "").toLowerCase());
                    });
                    setTickets(myTickets);
                }
            } catch (e) {
                console.error("Error:", e);
            } finally {
                setLoading(false);
            }
        }
        if (username) fetchData();
    }, [username, displayName]);

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const statusColor = (s) => ({
        Open: "bg-amber-100 text-amber-700 border-amber-200",
        In_Progress: "bg-blue-100 text-blue-700 border-blue-200",
        Waiting_on_Customer: "bg-purple-100 text-purple-700 border-purple-200",
        Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        Closed: "bg-slate-100 text-slate-600 border-slate-200",
    }[s] || "bg-slate-100 text-slate-600 border-slate-200");

    const priorityColor = (p) => ({
        Urgent: "bg-red-100 text-red-700 border-red-200",
        High: "bg-orange-100 text-orange-700 border-orange-200",
        Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
        Low: "bg-green-100 text-green-700 border-green-200",
    }[p] || "bg-slate-100 text-slate-600 border-slate-200");

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                <p className="text-slate-400">Loading your dashboard...</p>
            </div>
        );
    }

    const myOpenTickets = tickets.filter(t => t.Status !== "Resolved" && t.Status !== "Closed");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome, {displayName || username || "Agent"} 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Here&apos;s your support overview</p>
                </div>
                <button
                    onClick={() => router.push("/tickets/new")}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl gold-gradient-bg shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        icon={TicketCheck}
                        label="My Open Tickets"
                        value={myOpenTickets.length}
                        color="bg-blue-100 text-blue-600"
                    />
                    <KpiCard
                        icon={Headset}
                        label="Total Open"
                        value={stats.open}
                        color="bg-amber-100 text-amber-600"
                        sub={`${stats.total} total`}
                    />
                    <KpiCard
                        icon={CheckCircle2}
                        label="Resolved"
                        value={stats.resolved}
                        color="bg-emerald-100 text-emerald-600"
                    />
                    <KpiCard
                        icon={Clock}
                        label="Avg Resolution"
                        value={`${stats.avgResolutionHours}h`}
                        color="bg-purple-100 text-purple-600"
                    />
                </div>
            )}

            {/* My Tickets */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/40">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gold-500" />
                        My Active Tickets
                    </h3>
                    <button
                        onClick={() => router.push("/tickets")}
                        className="text-xs text-gold-600 hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {myOpenTickets.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
                            <p className="text-sm text-slate-500 font-medium">No active tickets</p>
                            <p className="text-xs text-slate-400 mt-1">All caught up! Create a new ticket or check All Tickets.</p>
                        </div>
                    ) : (
                        myOpenTickets.slice(0, 10).map(ticket => (
                            <div
                                key={ticket.Ticket_ID}
                                onClick={() => router.push(`/tickets/${ticket.Ticket_ID}`)}
                                className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs font-mono text-gold-600 shrink-0">{ticket.Ticket_ID}</span>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-700 truncate">{ticket.Title}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {ticket.Customer_Name || "Unknown"} · {timeAgo(ticket.Created_At)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${priorityColor(ticket.Priority)}`}>
                                        {ticket.Priority}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusColor(ticket.Status)}`}>
                                        {(ticket.Status || "Open").replace(/_/g, " ")}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Recent Unassigned */}
            {stats && stats.needsAttention && stats.needsAttention.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel rounded-2xl p-5 border-l-4 border-amber-400"
                >
                    <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Needs Attention
                    </h3>
                    <div className="space-y-2">
                        {stats.needsAttention.slice(0, 5).map(ticket => (
                            <div
                                key={ticket.Ticket_ID}
                                onClick={() => router.push(`/tickets/${ticket.Ticket_ID}`)}
                                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-mono text-amber-600">{ticket.Ticket_ID}</span>
                                    <span className="text-sm text-slate-700 truncate">{ticket.Title}</span>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${priorityColor(ticket.Priority)}`}>
                                    {ticket.Priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
