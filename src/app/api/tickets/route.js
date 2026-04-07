import { NextResponse } from 'next/server';
import { getAllTickets, createTicket } from '@/lib/google-sheets-tickets';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const filters = {
            status: searchParams.get('status') || undefined,
            priority: searchParams.get('priority') || undefined,
            assigned_to: searchParams.get('assigned_to') || undefined,
            search: searchParams.get('search') || undefined,
        };
        const tickets = await getAllTickets(filters);
        return NextResponse.json({ success: true, data: tickets });
    } catch (err) {
        console.error('GET /api/tickets error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        // Get the support user from middleware headers
        const author = req.headers.get('x-support-user') || body.created_by || 'support';
        const ticket = await createTicket({ ...body, created_by: author, source: 'manual' });
        return NextResponse.json({ success: true, data: ticket }, { status: 201 });
    } catch (err) {
        console.error('POST /api/tickets error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
