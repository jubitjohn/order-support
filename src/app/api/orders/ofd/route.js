import { NextResponse } from "next/server";
import { getOrdersMasterRaw } from "@/lib/google-sheets-orders";

export async function GET(request) {
    try {
        const orders = await getOrdersMasterRaw();
        
        // Filter for strictly Out_For_Delivery in Vendor_Status, or Courier_Status having it
        // AND must be a COD order
        const ofdOrders = orders.filter(order => {
            const vStatus = order['Vendor_Status'] || "";
            const cStatus = (order['Courier_Status'] || "").toLowerCase();
            const pMode = (order['Payment_Mode'] || order['Payment_Status'] || order['Payment Method'] || order['Payment'] || "").toLowerCase();
            
            const isOFD = vStatus === "Out_For_Delivery" || cStatus.includes("out for delivery");
            const isFinished = vStatus === "Delivered" || vStatus === "RTO" || vStatus === "Cancelled";
            const isCOD = pMode.includes("cod") || pMode.includes("cash");
            
            return isOFD && !isFinished && isCOD;
        });

        // Reverse to get newest first (simplistic approach assuming appended rows are newer)
        return NextResponse.json({ success: true, data: ofdOrders.reverse() });
    } catch (error) {
        console.error("Orders API Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
