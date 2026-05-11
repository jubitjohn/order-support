import { NextResponse } from "next/server";
import { updateOrderFields } from "@/lib/google-sheets-orders";

export async function POST(request) {
    try {
        const { orderId, rowNumber, status = "Called" } = await request.json();
        
        if (!orderId) {
            return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
        }

        // We use OFD_Called to store the "Called" status
        // This column will be auto-created by the library if it doesn't exist.
        await updateOrderFields(orderId, {
            "OFD_Called": status,
            "Last_Edited_At": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        }, rowNumber);

        return NextResponse.json({ success: true, message: `Order ${orderId} marked as ${status}` });
    } catch (error) {
        console.error("OFD Called API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update order" },
            { status: 500 }
        );
    }
}
