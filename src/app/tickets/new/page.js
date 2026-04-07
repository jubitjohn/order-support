"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/SupportAuthProvider";
import { Loader2, Plus, ArrowLeft } from "lucide-react";

export default function NewTicketPage() {
    const router = useRouter();
    const { username } = useAuth();
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        labels: "",
        order_id: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        product_name: "",
        preferred_resolution: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    assigned_to: username,
                    created_by: username,
                }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/tickets/${data.data.Ticket_ID}`);
            }
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setCreating(false);
        }
    };

    const COMPLAINT_TYPES = [
        "Damaged Product", "Wrong Item", "Missing Item", "Late Delivery",
        "Quality Issue", "Refund Request", "Other"
    ];

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-gold-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="flex items-center gap-3">
                <Plus className="w-7 h-7 text-gold-600" />
                <h1 className="text-2xl font-bold text-slate-800">Create New Ticket</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-6"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                            <input
                                required
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                placeholder="e.g. Damaged product received — Order #12345"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                            <textarea
                                required
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                                placeholder="Detailed description of the complaint..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Complaint Type</label>
                            <select
                                value={form.labels}
                                onChange={e => setForm({ ...form, labels: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                            >
                                <option value="">Select type...</option>
                                {COMPLAINT_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order ID</label>
                            <input
                                type="text"
                                value={form.order_id}
                                onChange={e => setForm({ ...form, order_id: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                placeholder="e.g. ORD-12345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                value={form.product_name}
                                onChange={e => setForm({ ...form, product_name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                placeholder="Product name or SKU"
                            />
                        </div>
                    </div>

                    {/* Customer Info Section */}
                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.customer_name}
                                    onChange={e => setForm({ ...form, customer_name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.customer_email}
                                    onChange={e => setForm({ ...form, customer_email: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={form.customer_phone}
                                    onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Resolution</label>
                        <select
                            value={form.preferred_resolution}
                            onChange={e => setForm({ ...form, preferred_resolution: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        >
                            <option value="">Select...</option>
                            <option value="Replacement">Replacement</option>
                            <option value="Refund">Refund</option>
                            <option value="Exchange">Exchange</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-6 py-2.5 text-sm font-medium rounded-xl gold-gradient-bg shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Ticket
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
