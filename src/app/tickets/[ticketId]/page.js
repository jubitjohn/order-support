"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/SupportAuthProvider";
import {
    Loader2, ArrowLeft, Send, Clock, User, Tag, AlertCircle,
    CheckCircle2, Edit3, X, Package, Mail, Phone, Hash,
    CalendarDays, Shield, Activity,
} from "lucide-react";

const STATUSES = ["Open", "In_Progress", "Waiting_on_Customer", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_STYLES = {
    Open: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    In_Progress: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    Waiting_on_Customer: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    Resolved: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    Closed: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-500" },
};

const PRIORITY_STYLES = {
    Urgent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    High: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    Low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
};

export default function TicketDetailPage({ params }) {
    const { ticketId } = use(params);
    const router = useRouter();
    const { username, displayName } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchTicket = useCallback(async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`);
            const data = await res.json();
            if (data.success) {
                const { comments: c, ...t } = data.data;
                setTicket(t);
                setComments(c || []);
            }
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => { fetchTicket(); }, [fetchTicket]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        const commentText = newComment;
        const authorName = displayName || username;
        // Optimistic: add comment to UI immediately
        const optimisticComment = {
            Comment_ID: `temp-${Date.now()}`,
            Ticket_ID: ticketId,
            Author: authorName,
            Content: commentText,
            Type: "comment",
            Created_At: new Date().toISOString(),
        };
        setComments(prev => [...prev, optimisticComment]);
        setNewComment("");
        setSending(true);
        try {
            await fetch(`/api/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: commentText, author: authorName }),
            });
            fetchTicket();
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setSending(false);
        }
    };

    const handleUpdate = async (field, value) => {
        const oldValue = ticket[field];
        if (oldValue === value) { setEditing(null); return; }
        const authorName = displayName || username;

        // Optimistic: update UI immediately
        setTicket(prev => ({ ...prev, [field]: value, Updated_At: new Date().toISOString() }));
        const activityContent = `Changed ${field.replace(/_/g, " ")} from "${oldValue || "none"}" to "${value}"`;
        const activityType = field === "Status" ? "status_change" : field === "Assigned_To" ? "assignment" : "label_change";
        const optimisticActivity = {
            Comment_ID: `temp-${Date.now()}`,
            Ticket_ID: ticketId,
            Author: authorName,
            Content: activityContent,
            Type: activityType,
            Created_At: new Date().toISOString(),
        };
        setComments(prev => [...prev, optimisticActivity]);
        setEditing(null);
        setSaving(false);

        // Fire both API calls in parallel (background)
        try {
            await Promise.all([
                fetch(`/api/tickets/${ticketId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [field]: value }),
                }),
                fetch(`/api/tickets/${ticketId}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: activityContent,
                        author: authorName,
                        type: activityType,
                    }),
                }),
            ]);
            fetchTicket();
        } catch (e) {
            console.error("Error:", e);
            setTicket(prev => ({ ...prev, [field]: oldValue }));
        }
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
    );

    if (!ticket) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-slate-600 font-medium">Ticket not found</p>
            <button onClick={() => router.push("/tickets")} className="text-sm text-gold-600 hover:underline">← Back</button>
        </div>
    );

    const statusStyle = STATUS_STYLES[ticket.Status] || STATUS_STYLES.Open;
    const priorityStyle = PRIORITY_STYLES[ticket.Priority] || PRIORITY_STYLES.Medium;
    const labels = (ticket.Labels || "").split(",").map(l => l.trim()).filter(Boolean);
    const slaDeadline = ticket.SLA_Deadline ? new Date(ticket.SLA_Deadline) : null;
    const isResolved = ticket.Status === "Resolved" || ticket.Status === "Closed";
    const slaBreach = slaDeadline && !isResolved && new Date() > slaDeadline;

    return (
        <div className="space-y-6">
            <button onClick={() => router.push("/tickets")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-gold-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Tickets
            </button>

            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gold-600 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">{ticket.Ticket_ID}</span>
                    {slaBreach && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> SLA Breached
                        </span>
                    )}
                </div>
                <h1 className="text-xl font-bold text-slate-800">{ticket.Title}</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Created {timeAgo(ticket.Created_At)} · Source: <span className="font-medium capitalize">{ticket.Source || "manual"}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Description</h3>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.Description || "No description."}</p>
                    </motion.div>

                    {/* Comments */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gold-500" /> Activity ({comments.length})
                        </h3>
                        <div className="space-y-4 mb-6">
                            {comments.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No activity yet</p>
                            ) : comments.map(c => {
                                const isSystem = c.Type !== "comment";
                                return (
                                    <div key={c.Comment_ID} className={`flex gap-3 ${isSystem ? "py-2" : "p-3 bg-white/60 rounded-xl border border-slate-100"}`}>
                                        {isSystem ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 w-full">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Activity className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <span className="font-medium">{c.Author}</span>
                                                <span>{c.Content}</span>
                                                <span className="ml-auto text-slate-400">{timeAgo(c.Created_At)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {(c.Author || "?")[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">{c.Author}</span>
                                                        <span className="text-xs text-slate-400">{timeAgo(c.Created_At)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{c.Content}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {(displayName || username || "S")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                                />
                                <button onClick={handleSendComment} disabled={sending || !newComment.trim()} className="px-4 py-2 rounded-xl gold-gradient-bg shadow-md hover:shadow-lg transition-all disabled:opacity-50 self-end">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700">Details</h3>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase font-medium">Status</span>
                                <button onClick={() => { setEditing("Status"); setEditValue(ticket.Status); }} className="text-xs text-gold-600 hover:underline"><Edit3 className="w-3 h-3 inline mr-1" />Edit</button>
                            </div>
                            {editing === "Status" ? (
                                <div className="flex gap-2 flex-wrap">
                                    {STATUSES.map(s => (
                                        <button key={s} onClick={() => handleUpdate("Status", s)} disabled={saving}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${s === ticket.Status ? `${STATUS_STYLES[s]?.bg} ${STATUS_STYLES[s]?.text} ${STATUS_STYLES[s]?.border}` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                                            {s.replace(/_/g, " ")}
                                        </button>
                                    ))}
                                    <button onClick={() => setEditing(null)} className="text-xs text-slate-400"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        {(ticket.Status || "Open").replace(/_/g, " ")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase font-medium">Priority</span>
                                <button onClick={() => { setEditing("Priority"); }} className="text-xs text-gold-600 hover:underline"><Edit3 className="w-3 h-3 inline mr-1" />Edit</button>
                            </div>
                            {editing === "Priority" ? (
                                <div className="flex gap-2 flex-wrap">
                                    {PRIORITIES.map(p => (
                                        <button key={p} onClick={() => handleUpdate("Priority", p)} disabled={saving}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${p === ticket.Priority ? `${PRIORITY_STYLES[p]?.bg} ${PRIORITY_STYLES[p]?.text} ${PRIORITY_STYLES[p]?.border}` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setEditing(null)} className="text-xs text-slate-400"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>{ticket.Priority || "Medium"}</span>
                            )}
                        </div>

                        {/* Assigned To */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase font-medium">Assigned To</span>
                                <button onClick={() => { setEditing("Assigned_To"); setEditValue(ticket.Assigned_To || ""); }} className="text-xs text-gold-600 hover:underline"><Edit3 className="w-3 h-3 inline mr-1" />Edit</button>
                            </div>
                            {editing === "Assigned_To" ? (
                                <div className="flex gap-2">
                                    <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400" placeholder="Agent username" />
                                    <button onClick={() => handleUpdate("Assigned_To", editValue)} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg gold-gradient-bg">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => setEditing(null)} className="text-xs text-slate-400"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User className="w-4 h-4 text-slate-400" />
                                    {ticket.Assigned_To || <span className="text-orange-500 text-xs font-medium">Unassigned</span>}
                                </div>
                            )}
                        </div>

                        {/* Labels */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase font-medium">Labels</span>
                                <button onClick={() => { setEditing("Labels"); setEditValue(ticket.Labels || ""); }} className="text-xs text-gold-600 hover:underline"><Edit3 className="w-3 h-3 inline mr-1" />Edit</button>
                            </div>
                            {editing === "Labels" ? (
                                <div className="flex gap-2">
                                    <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400" placeholder="e.g. refund, shipping" />
                                    <button onClick={() => handleUpdate("Labels", editValue)} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg gold-gradient-bg">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => setEditing(null)} className="text-xs text-slate-400"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-1.5 flex-wrap">
                                    {labels.length > 0 ? labels.map(l => (
                                        <span key={l} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md font-medium flex items-center gap-1"><Tag className="w-3 h-3" />{l}</span>
                                    )) : <span className="text-xs text-slate-400">No labels</span>}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Customer */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
                        <div className="space-y-2 text-sm">
                            {ticket.Customer_Name && <div className="flex items-center gap-2 text-slate-600"><User className="w-4 h-4 text-slate-400" />{ticket.Customer_Name}</div>}
                            {ticket.Customer_Email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /><a href={`mailto:${ticket.Customer_Email}`} className="text-gold-600 hover:underline">{ticket.Customer_Email}</a></div>}
                            {ticket.Customer_Phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{ticket.Customer_Phone}</div>}
                            {ticket.Order_ID && <div className="flex items-center gap-2 text-slate-600"><Package className="w-4 h-4 text-slate-400" /><span className="font-mono text-xs">{ticket.Order_ID}</span></div>}
                            {ticket.Product_Name && <div className="flex items-center gap-2 text-slate-600"><Hash className="w-4 h-4 text-slate-400" />{ticket.Product_Name}</div>}
                        </div>
                    </motion.div>

                    {/* Timeline */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-2xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
                        <div className="space-y-2 text-xs text-slate-500">
                            <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /><span>Created: {formatDate(ticket.Created_At)}</span></div>
                            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>Updated: {formatDate(ticket.Updated_At)}</span></div>
                            {ticket.SLA_Deadline && <div className={`flex items-center gap-2 ${slaBreach ? "text-red-600 font-semibold" : ""}`}><Shield className="w-3.5 h-3.5" /><span>SLA: {formatDate(ticket.SLA_Deadline)}</span></div>}
                            {ticket.Resolved_At && <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /><span>Resolved: {formatDate(ticket.Resolved_At)}</span></div>}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
