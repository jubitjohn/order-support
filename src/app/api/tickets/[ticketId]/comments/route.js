import { NextResponse } from 'next/server';
import { getComments, addComment } from '@/lib/google-sheets-tickets';

export async function GET(req, { params }) {
    try {
        const { ticketId } = await params;
        const comments = await getComments(ticketId);
        return NextResponse.json({ success: true, data: comments });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { ticketId } = await params;
        const body = await req.json();
        const author = req.headers.get('x-support-user') || body.author || 'Support';
        const comment = await addComment({
            ticket_id: ticketId,
            author,
            content: body.content,
            type: body.type || 'comment',
        });
        return NextResponse.json({ success: true, data: comment }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
