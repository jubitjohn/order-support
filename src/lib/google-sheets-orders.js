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

    // Convert to objects
    const data = rows.map(row => row.toObject());
    return data;
}
