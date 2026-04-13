"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Truck, PhoneCall, AlertTriangle, MessageSquarePlus, CheckCircle2, Search, Crosshair } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OFDTracker() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchOFD() {
            try {
                const res = await fetch("/api/orders/ofd");
                const data = await res.json();
                if (data.success) {
                    setOrders(data.data);
                }
            } catch (e) {
                console.error("Failed to fetch OFD orders:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchOFD();
        // Auto refresh every 5 mins
        const interval = setInterval(fetchOFD, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        return (o.Order_ID || "").toLowerCase().includes(q) ||
               (o.Customer_Name || "").toLowerCase().includes(q) ||
               (o.Phone || "").includes(q);
    });

    // Check if COD loosely (Payment mode string contains "COD" or "Cash")
    const isCOD = (order) => {
        const p = (order['Payment_Mode'] || order['Payment Method'] || order['Payment'] || "").toLowerCase();
        return p.includes("cod") || p.includes("cash");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                <p className="text-slate-400">Locating active Out for Delivery orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-gold-500" />
                        Out For Delivery Tracker
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Proactively monitor and contact customers whose orders are arriving today.
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm font-medium text-blue-800">
                <Crosshair className="w-5 h-5 text-blue-600 shrink-0" />
                <p>
                    <strong>Agent Instructions:</strong> Identify COD orders and proactively call the customer. Inform them their Enchain Gifts order is arriving today and remind them to keep the cash ready. This heavily drops RTO rates!
                </p>
            </motion.div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Name, or Phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl subtle-ring inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {filtered.length} Active OFD
                </div>
            </div>

            {/* Orders List */}
            {filtered.length === 0 ? (
                <div className="glass-panel rounded-2xl p-16 text-center shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">All clear!</h3>
                    <p className="text-slate-500 mt-1">There are no orders actively out for delivery matching your criteria right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((order, idx) => {
                        const amountStr = (order.Amount || "").toString().replace(/[^\d.-]/g, '');
                        const amount = parseFloat(amountStr) || 0;
                        const phone = (order.Phone || "").toString().replace(/\\D/g, "");
                        const isCodOrder = isCOD(order);

                        return (
                            <motion.div
                                key={order.Order_ID || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-lg ${isCodOrder ? 'border border-amber-200 shadow-amber-500/5' : ''}`}
                            >
                                {isCodOrder && (
                                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm">
                                        COD Required
                                    </div>
                                )}
                                
                                <div className="pr-12">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded border border-gold-100">
                                            {order.Order_ID}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            ₹{amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mt-2 truncate">
                                        {order.Customer_Name || "Customer"}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {order.City ? `${order.City}, ` : ""}{order.Pincode || "No Pincode"}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100/60 flex items-center justify-between gap-2">
                                    <a
                                        href={`tel:+91${phone}`}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                                            isCodOrder
                                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                        }`}
                                    >
                                        <PhoneCall className="w-4 h-4" />
                                        Call {isCodOrder ? "for COD" : "Customer"}
                                    </a>
                                    
                                    <button
                                        onClick={() => router.push(`/tickets/new?order_id=${order.Order_ID}&customer_name=${encodeURIComponent(order.Customer_Name || "")}&phone=${encodeURIComponent(order.Phone || "")}`)}
                                        className="shrink-0 flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                        title="Log Support Ticket"
                                    >
                                        <MessageSquarePlus className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
