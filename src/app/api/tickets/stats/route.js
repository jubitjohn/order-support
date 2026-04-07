import { NextResponse } from 'next/server';
import { getTicketStats } from '@/lib/google-sheets-tickets';

export async function GET() {
    try {
        const stats = await getTicketStats();
        return NextResponse.json({ success: true, data: stats });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
