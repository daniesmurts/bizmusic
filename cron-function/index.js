const https = require('https');

function callEndpoint(path, cronSecret) {
    const options = {
        hostname: 'bizmuzik.ru',
        path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${cronSecret}`,
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`[Cron] ${path} -> ${res.statusCode}`);
                resolve({
                    path,
                    statusCode: res.statusCode,
                    body: data,
                });
            });
        });
        req.on('error', (e) => {
            console.error(`[Cron] HTTP error for ${path}: ${e.message}`);
            reject(e);
        });
        req.end();
    });
}

module.exports.handler = async function() {
    console.log("Cron triggered! Calling billing and support retry jobs");
    
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
        console.error("CRON_SECRET env var is not set!");
        return { statusCode: 500, body: "CRON_SECRET not configured" };
    }

    const billingResult = await callEndpoint('/api/cron/billing', CRON_SECRET);
    const supportRetryResult = await callEndpoint('/api/cron/support-delivery-retry', CRON_SECRET);

    const hasFailure = billingResult.statusCode >= 400 || supportRetryResult.statusCode >= 400;

    return {
        statusCode: hasFailure ? 500 : 200,
        body: JSON.stringify({
            billing: billingResult,
            supportRetry: supportRetryResult,
        }),
    };
};
