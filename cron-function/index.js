const https = require('https');

module.exports.handler = async function() {
    console.log("Cron triggered! Calling https://bizmuzik.ru/api/cron/billing");
    
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
        console.error("CRON_SECRET env var is not set!");
        return { statusCode: 500, body: "CRON_SECRET not configured" };
    }

    const options = {
        hostname: 'bizmuzik.ru',
        path: '/api/cron/billing',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${CRON_SECRET}`,
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`Response received with status: ${res.statusCode}`);
                console.log(`Response body: ${data}`);
                resolve({ 
                    statusCode: res.statusCode, 
                    body: data 
                });
            });
        });
        req.on('error', (e) => {
            console.error(`Error HTTP request: ${e.message}`);
            reject(e);
        });
        req.end();
    });
};
