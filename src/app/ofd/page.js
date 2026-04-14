"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Truck, PhoneCall, AlertTriangle, MessageSquarePlus, CheckCircle2, Search, Crosshair, Package, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function OFDTracker() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [marking, setMarking] = useState({}); // Tracking loading state for each order


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
        const p = (order['Payment_Mode'] || order['Payment_Status'] || order['Payment Method'] || order['Payment'] || "").toLowerCase();
        return p.includes("cod") || p.includes("cash");
    };

    const handleMarkCalled = async (orderId, rowNumber) => {
        setMarking(prev => ({ ...prev, [orderId]: true }));
        try {
            const res = await fetch("/api/orders/ofd/called", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, rowNumber, status: "Called" })
            });
            const data = await res.json();
            if (data.success) {
                // Optimistically update the UI
                setOrders(prev => prev.map(o => 
                    o.Order_ID === orderId ? { ...o, OFD_Called: "Called" } : o
                ));
            }
        } catch (e) {
            console.error("Failed to mark as called:", e);
        } finally {
            setMarking(prev => ({ ...prev, [orderId]: false }));
        }
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((order, idx) => {
                        const amountStr = (order.Amount || "").toString().replace(/[^\d.-]/g, '');
                        const amount = parseFloat(amountStr) || 0;
                        const phone = (order.Phone || "").toString().replace(/\\D/g, "");
                        const isCodOrder = isCOD(order);
                        const isCalled = order.OFD_Called === "Called";

                        return (
                            <motion.div
                                key={order.Order_ID || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "glass-panel rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300",
                                    isCalled ? "opacity-75 blur-[0.2px] grayscale-[0.3]" : "hover:shadow-xl hover:shadow-gold-500/10 hover:-translate-y-1",
                                    isCodOrder && !isCalled && "border-amber-200/50 shadow-lg shadow-amber-500/5"
                                )}
                            >
                                {/* Status Badges */}
                                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                                    {isCalled ? (
                                        <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 border border-emerald-400">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Already Called
                                        </div>
                                    ) : (
                                        isCodOrder && (
                                            <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1.5 border border-amber-400">
                                                <AlertTriangle className="w-3 h-3" />
                                                COD Required
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-mono font-black text-gold-600 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200 uppercase tracking-tighter">
                                            {order.Order_ID}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 leading-tight">
                                        {order.Customer_Name || "Customer"}
                                    </h3>

                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                <Package className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</span>
                                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                                                    {order.Product_Type || order.Product || "Standard Item"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50/50 flex items-center justify-center border border-blue-100/50 shrink-0">
                                                <Truck className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Courier Partner</span>
                                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                                                    {order.Courier || "Assigning..."}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mt-0.5">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</span>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium mt-0.5">
                                                    {order.Address || "Address not available"}
                                                </p>
                                                <p className="text-[10px] text-gold-600 font-black uppercase tracking-widest mt-1">
                                                    {order.City || "Unknown City"} · {order.Pincode || "000000"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Info & Actions */}
                                <div className="p-6 pt-0 mt-auto">
                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Amount</span>
                                            <span className="text-lg font-black text-slate-800 tracking-tight">₹{amount.toLocaleString()}</span>
                                        </div>
                                        {isCodOrder && (
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Payment Method</span>
                                                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-md border border-amber-200 uppercase">Cash on Delivery</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <a
                                            href={`tel:+91${phone}`}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
                                                isCalled 
                                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                                                    : "gold-gradient-bg text-white shadow-gold-500/20 hover:shadow-gold-500/40"
                                            )}
                                        >
                                            <PhoneCall className="w-4 h-4" />
                                            Call Now
                                        </a>

                                        {!isCalled && (
                                            <button
                                                onClick={() => handleMarkCalled(order.Order_ID, order._rowNumber)}
                                                disabled={marking[order.Order_ID]}
                                                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-2xl transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm active:scale-90"
                                                title="Mark as Called"
                                            >
                                                {marking[order.Order_ID] ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => router.push(`/tickets/new?order_id=${order.Order_ID}&customer_name=${encodeURIComponent(order.Customer_Name || "")}&phone=${encodeURIComponent(order.Phone || "")}&product_name=${encodeURIComponent(order.Product_Type || order.Product || "")}`)}
                                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-2xl transition-all hover:bg-gold-50 hover:text-gold-600 hover:border-gold-200 shadow-sm active:scale-90"
                                            title="Log Support Ticket"
                                        >
                                            <MessageSquarePlus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
