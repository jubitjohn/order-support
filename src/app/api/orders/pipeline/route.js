import { NextResponse } from "next/server";
import { getOrdersMasterRaw } from "@/lib/google-sheets-orders";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const orders = await getOrdersMasterRaw();

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 60);
        cutoff.setHours(0, 0, 0, 0);

        let inTransit = 0, outForDelivery = 0, delivered = 0, rto = 0;

        for (const order of orders) {
            const status = (order["Vendor_Status"] || "").trim();

            if (status === "In_Transit") {
                inTransit++;
            } else if (status === "Out_For_Delivery") {
                outForDelivery++;
            } else if (status === "Delivered" || status === "RTO") {
                // Only count within the last 60 days
                const rawDate = order["Timestamp"] || order["Date"] || "";
                if (rawDate) {
                    const parts = rawDate.split(" ")[0].split("/");
                    if (parts.length === 3) {
                        const orderDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        if (orderDate >= cutoff) {
                            if (status === "Delivered") delivered++;
                            else rto++;
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, data: { inTransit, outForDelivery, delivered, rto } });
    } catch (error) {
        console.error("[Pipeline API] Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
