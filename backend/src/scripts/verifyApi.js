const http = require('http');

const postData = JSON.stringify({
    eventType: 'view',
    session_id: 'node-script-session',
    productId: '507f1f77bcf86cd799439011',
    metadata: { source: 'test-script' }
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/tracking',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

const req = http.request(options, (res) => {
    console.log(`POST STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`POST BODY: ${chunk}`);

        // After POST success, try GET
        if (res.statusCode === 201) {
            verifyGet();
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();

function verifyGet() {
    http.get('http://localhost:3000/api/v1/tracking/recent?session_id=node-script-session', (res) => {
        console.log(`GET STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`GET BODY: ${data}`);
        });
    }).on('error', (e) => {
        console.error(`GET error: ${e.message}`);
    });
}
