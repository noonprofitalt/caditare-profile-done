const https = require('https');

const data = JSON.stringify({
    name: 'erp-suharacore'
});

const options = {
    hostname: 'api.netlify.com',
    path: '/api/v1/sites',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer nfp_PHNvFnVHH38DJU1zcqCMtUUD76ULVoMJ102f',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(body);
            console.log(`Site ID: ${response.id}`);
            console.log(`URL: ${response.url}`);
            console.log(`Name: ${response.name}`);
        } else {
            console.error('Error:', body);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
