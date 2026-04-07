import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// ─── Connection Cache (reuse authenticated doc for 5 min) ───────────

let _cachedDoc = null;
let _cachedDocTime = 0;
const DOC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _cachedSheets = {};
let _cachedSheetsTime = 0;
const SHEET_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getJwt() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let envKey = process.env.GOOGLE_PRIVATE_KEY || '';
    if (envKey.startsWith('"') && envKey.endsWith('"')) {
        envKey = envKey.slice(1, -1);
    }
    const key = envKey.replace(/\\n/g, '\n');
    return new JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

async function getDoc() {
    const now = Date.now();
    if (_cachedDoc && (now - _cachedDocTime) < DOC_CACHE_TTL) {
        return _cachedDoc;
    }
    const sheetId = process.env.MASTER_LOOKUP_SHEET_ID;
    const jwt = getJwt();
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    _cachedDoc = doc;
    _cachedDocTime = now;
    _cachedSheets = {}; // invalidate sheet cache when doc refreshes
    _cachedSheetsTime = 0;
    return doc;
}

// ─── Sheet Accessors (cached) ───────────────────────────────────────

export async function getTicketsSheet() {
    const now = Date.now();
    if (_cachedSheets.tickets && (now - _cachedSheetsTime) < SHEET_CACHE_TTL) {
        return _cachedSheets.tickets;
    }
    const doc = await getDoc();
    const gid = process.env.SUPPORT_TICKETS_GID;
    if (!gid) throw new Error('SUPPORT_TICKETS_GID is not set');
    const sheet = doc.sheetsById[gid];
    if (!sheet) throw new Error(`Support_Tickets sheet (GID ${gid}) not found`);
    await sheet.loadHeaderRow(1);
    _cachedSheets.tickets = sheet;
    _cachedSheetsTime = now;
    return sheet;
}

export async function getCommentsSheet() {
    const now = Date.now();
    if (_cachedSheets.comments && (now - _cachedSheetsTime) < SHEET_CACHE_TTL) {
        return _cachedSheets.comments;
    }
    const doc = await getDoc();
    const gid = process.env.TICKET_COMMENTS_GID;
    if (!gid) throw new Error('TICKET_COMMENTS_GID is not set');
    const sheet = doc.sheetsById[gid];
    if (!sheet) throw new Error(`Ticket_Comments sheet (GID ${gid}) not found`);
    await sheet.loadHeaderRow(1);
    _cachedSheets.comments = sheet;
    _cachedSheetsTime = now;
    return sheet;
}

// ─── ID Generators ──────────────────────────────────────────────────

function generateTicketId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `TKT-${ts}${rand}`;
}

function generateCommentId() {
    return `CMT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
}

// ─── SLA Calculation ────────────────────────────────────────────────

function computeSLADeadline(priority, createdAt) {
    const created = new Date(createdAt);
    const hoursMap = { Urgent: 24, High: 48, Medium: 72, Low: 96 };
    const hours = hoursMap[priority] || 72;
    return new Date(created.getTime() + hours * 60 * 60 * 1000).toISOString();
}

// ─── Ticket CRUD ────────────────────────────────────────────────────

export async function getAllTickets(filters = {}) {
    const sheet = await getTicketsSheet();
    const rows = await sheet.getRows();
    let tickets = rows.map(row => row.toObject());

    // Apply filters
    if (filters.status && filters.status !== 'All') {
        tickets = tickets.filter(t => t.Status === filters.status);
    }
    if (filters.priority && filters.priority !== 'All') {
        tickets = tickets.filter(t => t.Priority === filters.priority);
    }
    if (filters.assigned_to && filters.assigned_to !== 'All') {
        const assignedQ = filters.assigned_to.toLowerCase();
        tickets = tickets.filter(t => (t.Assigned_To || '').toLowerCase().includes(assignedQ));
    }
    if (filters.search) {
        const q = filters.search.toLowerCase();
        tickets = tickets.filter(t =>
            (t.Ticket_ID || '').toLowerCase().includes(q) ||
            (t.Title || '').toLowerCase().includes(q) ||
            (t.Customer_Name || '').toLowerCase().includes(q) ||
            (t.Order_ID || '').toLowerCase().includes(q) ||
            (t.Description || '').toLowerCase().includes(q)
        );
    }

    // Sort by Created_At descending (newest first)
    tickets.sort((a, b) => {
        const da = new Date(a.Created_At || 0);
        const db = new Date(b.Created_At || 0);
        return db - da;
    });

    return tickets;
}

export async function getTicketById(ticketId) {
    const sheet = await getTicketsSheet();
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('Ticket_ID') === ticketId);
    if (!row) return null;
    return row.toObject();
}

export async function createTicket(data) {
    const sheet = await getTicketsSheet();
    const now = new Date().toISOString();
    const ticketId = generateTicketId();
    const priority = data.priority || 'Medium';

    const ticketRow = {
        Ticket_ID: ticketId,
        Title: data.title || 'Untitled Ticket',
        Description: data.description || '',
        Status: 'Open',
        Priority: priority,
        Labels: data.labels || data.complaint_type || '',
        Assigned_To: data.assigned_to || '',
        Created_By: data.created_by || 'manual',
        Source: data.source || 'manual',
        Order_ID: data.order_id || '',
        Customer_Name: data.customer_name || '',
        Customer_Email: data.customer_email || '',
        Customer_Phone: data.customer_phone || '',
        Product_Name: data.product_name || '',
        Preferred_Resolution: data.preferred_resolution || '',
        Created_At: now,
        Updated_At: now,
        Resolved_At: '',
        SLA_Deadline: computeSLADeadline(priority, now),
    };

    await sheet.addRow(ticketRow);
    return ticketRow;
}

export async function updateTicket(ticketId, updates) {
    const sheet = await getTicketsSheet();
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('Ticket_ID') === ticketId);
    if (!row) throw new Error(`Ticket ${ticketId} not found`);

    const allowedFields = ['Title', 'Description', 'Status', 'Priority', 'Labels', 'Assigned_To'];
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            row.set(field, updates[field]);
        }
    }

    // If priority changed, recalculate SLA
    if (updates.Priority) {
        const createdAt = row.get('Created_At') || new Date().toISOString();
        row.set('SLA_Deadline', computeSLADeadline(updates.Priority, createdAt));
    }

    // If status changed to Resolved/Closed, set Resolved_At
    if (updates.Status === 'Resolved' || updates.Status === 'Closed') {
        if (!row.get('Resolved_At')) {
            row.set('Resolved_At', new Date().toISOString());
        }
    }

    row.set('Updated_At', new Date().toISOString());
    await row.save();

    return row.toObject();
}

// ─── Comments ───────────────────────────────────────────────────────

export async function getComments(ticketId) {
    const sheet = await getCommentsSheet();
    const rows = await sheet.getRows();
    const comments = rows
        .map(r => r.toObject())
        .filter(c => c.Ticket_ID === ticketId)
        .sort((a, b) => new Date(a.Created_At || 0) - new Date(b.Created_At || 0));
    return comments;
}

export async function addComment(data) {
    const sheet = await getCommentsSheet();
    const commentRow = {
        Comment_ID: generateCommentId(),
        Ticket_ID: data.ticket_id,
        Author: data.author || 'System',
        Content: data.content || '',
        Type: data.type || 'comment',
        Created_At: new Date().toISOString(),
    };
    await sheet.addRow(commentRow);
    return commentRow;
}

// ─── Stats / KPIs ───────────────────────────────────────────────────

export async function getTicketStats() {
    const tickets = await getAllTickets();
    const now = new Date();

    const openTickets = tickets.filter(t => t.Status === 'Open' || t.Status === 'In_Progress' || t.Status === 'Waiting_on_Customer');
    const resolvedTickets = tickets.filter(t => t.Status === 'Resolved' || t.Status === 'Closed');

    // SLA breached = open tickets past their SLA deadline
    const slaBreached = openTickets.filter(t => {
        if (!t.SLA_Deadline) return false;
        return new Date(t.SLA_Deadline) < now;
    });

    // Unassigned
    const unassigned = openTickets.filter(t => !t.Assigned_To || t.Assigned_To.trim() === '');

    // Avg resolution time (in hours) for resolved tickets
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
        const totalHours = resolvedTickets.reduce((sum, t) => {
            const created = new Date(t.Created_At || now);
            const resolved = new Date(t.Resolved_At || now);
            return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = Math.round(totalHours / resolvedTickets.length);
    }

    // Agent workload
    const workloadMap = {};
    openTickets.forEach(t => {
        const agent = t.Assigned_To || 'Unassigned';
        workloadMap[agent] = (workloadMap[agent] || 0) + 1;
    });
    const agentWorkload = Object.entries(workloadMap).map(([agent, count]) => ({ agent, count }));

    // Status distribution
    const statusMap = {};
    tickets.forEach(t => {
        const s = t.Status || 'Unknown';
        statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Priority distribution
    const priorityMap = {};
    tickets.forEach(t => {
        const p = t.Priority || 'Unknown';
        priorityMap[p] = (priorityMap[p] || 0) + 1;
    });
    const priorityDistribution = Object.entries(priorityMap).map(([priority, count]) => ({ priority, count }));

    // Tickets needing attention (unassigned, SLA breached, or high/urgent priority & open)
    const needsAttention = openTickets.filter(t => {
        const isUnassigned = !t.Assigned_To || t.Assigned_To.trim() === '';
        const isSLABreached = t.SLA_Deadline && new Date(t.SLA_Deadline) < now;
        const isHighPriority = t.Priority === 'Urgent' || t.Priority === 'High';
        return isUnassigned || isSLABreached || isHighPriority;
    });

    return {
        total: tickets.length,
        open: openTickets.length,
        resolved: resolvedTickets.length,
        slaBreached: slaBreached.length,
        unassigned: unassigned.length,
        avgResolutionHours,
        agentWorkload,
        statusDistribution,
        priorityDistribution,
        needsAttention: needsAttention.slice(0, 10), // Top 10
        recentTickets: tickets.slice(0, 5), // 5 most recent
    };
}
