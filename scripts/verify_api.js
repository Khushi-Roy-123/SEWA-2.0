import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
const testUser = {
    name: 'Test Agent',
    email: `agent_${Date.now()}@test.com`,
    password: 'password123',
    dob: '1990-01-01'
};

async function testAuth() {
    console.log('Testing Registration...');
    const regRes = await fetch(`${BASE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    
    if (regRes.status !== 200) {
        console.error('Registration Failed:', await regRes.text());
        return false;
    }
    const regData = await regRes.json();
    console.log('Registration Success:', regData);

    console.log('Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    
    if (loginRes.status !== 200) {
        console.error('Login Failed:', await loginRes.text());
        return false;
    }
    
    const data = await loginRes.json();
    authToken = data.token;
    console.log('Login Success, Token received');
    return true;
}

async function runTests() {
    try {
        console.log('Starting API Tests...');
        if (!await testAuth()) return;
        
        console.log('All Basic Auth Tests Passed!');
    } catch (e) {
        console.error('Test Error:', e);
    }
}

runTests();
