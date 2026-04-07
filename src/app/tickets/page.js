"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Loader2, Search, Filter, ArrowRight, Headset, RefreshCw, Plus,
} from "lucide-react";

const STATUSES = ["All", "Open", "In_Progress", "Waiting_on_Customer", "Resolved", "Closed"];
const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];

export default function TicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tickets");
            const data = await res.json();
            if (data.success) setTickets(data.data);
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const filteredTickets = tickets.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            (t.Ticket_ID || "").toLowerCase().includes(q) ||
            (t.Title || "").toLowerCase().includes(q) ||
            (t.Customer_Name || "").toLowerCase().includes(q) ||
            (t.Order_ID || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || t.Status === statusFilter;
        const matchPriority = priorityFilter === "All" || t.Priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

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

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const getSLAStatus = (ticket) => {
        if (!ticket.SLA_Deadline) return "none";
        if (ticket.Status === "Resolved" || ticket.Status === "Closed") return "met";
        const deadline = new Date(ticket.SLA_Deadline);
        if (new Date() > deadline) return "breached";
        if ((deadline - new Date()) / (1000 * 60 * 60) < 4) return "warning";
        return "ok";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">All Tickets</h1>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button onClick={() => router.push("/tickets/new")} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl gold-gradient-bg shadow-md hover:shadow-lg transition-all">
                        <Plus className="w-4 h-4" />
                        New Ticket
                    </button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/40">
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors shadow-sm ${statusFilter !== "All" ? "bg-gold-50 text-gold-700 border-gold-200" : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"}`}
                            >
                                <Filter className="w-4 h-4" />
                                {statusFilter === "All" ? "Status" : statusFilter.replace(/_/g, " ")}
                            </button>
                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                                        {STATUSES.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === s ? "text-gold-600 font-medium bg-gold-50/50" : "text-slate-600"}`}
                                            >
                                                {s.replace(/_/g, " ")}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <select
                            className="border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-600 bg-white focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 cursor-pointer shadow-sm"
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                        >
                            {PRIORITIES.map(p => (
                                <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>
                            ))}
                        </select>
                        {(search || statusFilter !== "All" || priorityFilter !== "All") && !loading && (
                            <span className="px-3 py-1 bg-gold-50 text-gold-700 text-xs font-bold rounded-full border border-gold-200">
                                {filteredTickets.length} result{filteredTickets.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                            <p>Loading tickets...</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Ticket ID</th>
                                    <th className="px-6 py-4 font-semibold">Title</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Priority</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Assigned</th>
                                    <th className="px-6 py-4 font-semibold">SLA</th>
                                    <th className="px-6 py-4 font-semibold">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTickets.slice(0, 100).map((t, i) => {
                                    const sla = getSLAStatus(t);
                                    return (
                                        <tr
                                            key={t.Ticket_ID || i}
                                            onClick={() => router.push(`/tickets/${t.Ticket_ID}`)}
                                            className="hover:bg-slate-50/50 cursor-pointer group transition-colors"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs text-gold-700">{t.Ticket_ID}</td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <div className="font-medium text-slate-700 truncate">{t.Title}</div>
                                                {t.Labels && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {t.Labels.split(",").map(l => l.trim()).filter(Boolean).map(label => (
                                                            <span key={label} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded font-medium">{label}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700">{t.Customer_Name || "—"}</div>
                                                <div className="text-xs text-slate-400">{t.Order_ID || ""}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${priorityColor(t.Priority)}`}>{t.Priority}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColor(t.Status)}`}>{(t.Status || "Open").replace(/_/g, " ")}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">
                                                {t.Assigned_To || <span className="text-orange-500 font-medium">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {sla === "breached" && <span className="text-red-600 font-semibold">⚠ Breached</span>}
                                                {sla === "warning" && <span className="text-amber-600 font-semibold">⏰ Soon</span>}
                                                {sla === "ok" && <span className="text-green-600">On track</span>}
                                                {(sla === "met" || sla === "none") && <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{timeAgo(t.Created_At)}</td>
                                        </tr>
                                    );
                                })}
                                {filteredTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-16 text-center text-slate-400">
                                            <Headset className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium">No tickets found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
