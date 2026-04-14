import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

function getJwt() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let envKey = process.env.GOOGLE_PRIVATE_KEY || '';

    if (envKey.startsWith('"') && envKey.endsWith('"')) {
        envKey = envKey.slice(1, -1);
    }
    const key = envKey.replace(/\\n/g, '\n');

    return new JWT({
        email: email,
        key: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

const MASTER_ORDERS_GID = '339152687';

export async function getMasterDoc() {
    const sheetId = process.env.MASTER_LOOKUP_SHEET_ID;
    const jwt = getJwt();
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    return doc;
}

export async function getOrdersMasterRaw() {
    const doc = await getMasterDoc();
    const sheet = doc.sheetsById[MASTER_ORDERS_GID];
    if (!sheet) {
        throw new Error(`Sheet with ID ${MASTER_ORDERS_GID} not found`);
    }

    await sheet.loadHeaderRow(2);
    const rows = await sheet.getRows();

    // Convert to objects, include row number for faster updates
    const data = rows.map(row => ({
        ...row.toObject(),
        _rowNumber: row.rowNumber
    }));
    return data;
}

export async function updateOrderFields(orderId, updates, rowNumberHint = null) {
    const doc = await getMasterDoc();
    const sheet = doc.sheetsById[MASTER_ORDERS_GID];
    if (!sheet) throw new Error(`Sheet with ID ${MASTER_ORDERS_GID} not found`);

    await sheet.loadHeaderRow(2);
    
    // Auto-manage missing headers
    const headers = sheet.headerValues;
    let headersChanged = false;
    for (const key of Object.keys(updates)) {
        if (!headers.includes(key) && !key.includes('Last_Edited')) {
            headers.push(key);
            headersChanged = true;
        }
    }
    if (headersChanged) {
        await sheet.setHeaderRow(headers, 2);
    }

    let row;
    if (rowNumberHint) {
        // Optimization: Try direct access if row number is known
        // Data rows start after headerRow (row 2), so row 3 is index 0
        const offset = Math.max(0, parseInt(rowNumberHint) - 3);
        const singleRowSearch = await sheet.getRows({ offset, limit: 1 });
        const possibleRow = singleRowSearch[0];
        
        // Verify Order_ID matches before applying (safety first)
        if (possibleRow && possibleRow.get('Order_ID')?.toString() === orderId?.toString()) {
            row = possibleRow;
        }
    }

    if (!row) {
        // Fallback to searching if no hint or hint mismatch
        const rows = await sheet.getRows();
        row = rows.find(r => r.get('Order_ID')?.toString() === orderId?.toString());
    }
    
    if (!row) throw new Error(`Order ${orderId} not found`);

    // Perform the update
    for (const [key, value] of Object.entries(updates)) {
        row.set(key, value !== null ? value.toString() : '');
    }

    await row.save();
    return true;
}
