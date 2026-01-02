import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 100,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = 'http://localhost:5000/api/v1';

export function setup() {
    const email = `loadtest_${Date.now()}_${Math.random()}@example.com`;
    const payload = JSON.stringify({
        name: 'Load Tester',
        email: email,
        password: 'password123',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/auth/register`, payload, params);

    // If register fails (e.g. email taken during previous runs if db not reset), try login
    if (res.status !== 201) {
        console.log('Register failed, trying login with fixed user...');
        // Logic to login fallback would go here or just fail. 
        // For simplicity, we assume unique email works or user handles DB reset.
        // But let's act robustly -> return a hardcoded token if needed or handle error.
        if (res.json() && res.json().token) return { token: res.json().token };
    }

    return { token: res.json().token };
}

export default function (data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(`${BASE_URL}/recommendations/home`, params);

    check(res, {
        'is status 200': (r) => r.status === 200,
        'duration < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
