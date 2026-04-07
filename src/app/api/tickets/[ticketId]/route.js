import { NextResponse } from 'next/server';
import { getTicketById, updateTicket, getComments } from '@/lib/google-sheets-tickets';

export async function GET(req, { params }) {
    try {
        const { ticketId } = await params;
        const ticket = await getTicketById(ticketId);
        if (!ticket) {
            return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
        }
        const comments = await getComments(ticketId);
        return NextResponse.json({ success: true, data: { ...ticket, comments } });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { ticketId } = await params;
        const body = await req.json();
        const updated = await updateTicket(ticketId, body);
        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
