const https = require('https');

module.exports.handler = async function(event, context) {
    console.log("Cron triggered! Calling https://bizmuzik.ru/api/cron/billing");
    
    return new Promise((resolve, reject) => {
        https.get('https://bizmuzik.ru/api/cron/billing', (res) => {
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
        }).on('error', (e) => {
            console.error(`Error HTTP GET: ${e.message}`);
            reject(e);
        });
    });
};
