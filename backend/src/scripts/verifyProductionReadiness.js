const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

const testSecurity = async () => {
    console.log('--- Verbose Security Verification ---');

    // 1. Test NoSQL Injection
    console.log('[TEST 1] NoSQL Injection ($gt)');
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: { "$gt": "" },
            password: "somepassword"
        });
        console.log('   FAILED: Request should have been sanitized/rejected but got 200');
    } catch (err) {
        console.log('   OK: Received error status:', err.response?.status || err.code);
        if (err.response?.data) console.log('   Response body snippet:', JSON.stringify(err.response.data).substring(0, 100));
    }

    // 2. Test XSS
    console.log('[TEST 2] XSS Sanitization (<script>)');
    const email = `xss_${Date.now()}@test.com`;
    try {
        const res = await axios.post(`${API_URL}/auth/register`, {
            name: 'User <script>alert(1)</script>',
            email,
            password: 'Password123'
        });
        console.log('   Success: User registered.');
        console.log('   Stored Name:', res.data.user.name);
        if (!res.data.user.name.includes('<script>')) {
            console.log('   VERIFIED: <script> tag was removed/sanitized.');
        } else {
            console.log('   FAILED: <script> tag still present.');
        }
    } catch (err) {
        console.log('   FAILED: Register threw error:', err.response?.status || err.code);
        if (err.response?.data) console.log('   Error body:', JSON.stringify(err.response.data));
    }
};

testSecurity();
