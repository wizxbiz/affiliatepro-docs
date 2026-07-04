const fs = require('fs');
const { cert } = require('firebase-admin/app');

try {
    const sa = JSON.parse(fs.readFileSync('assets/service-account.json', 'utf8'));
    console.log('Original private_key length:', sa.private_key.length);

    // Try as is
    try {
        cert(sa);
        console.log('SUCCESS: cert(sa) worked for assets/service-account.json as is');
    } catch (e1) {
        console.log('FAILED as is:', e1.message);

        // Try with replace
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
        try {
            cert(sa);
            console.log('SUCCESS: cert(sa) worked for assets/service-account.json after replace');
        } catch (e2) {
            console.log('FAILED after replace:', e2.message);
        }
    }
} catch (e) {
    console.log('ERROR leading file:', e.message);
}
