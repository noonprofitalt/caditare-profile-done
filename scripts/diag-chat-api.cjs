const http = require('http');

const API_URL = 'http://localhost:3001';
const MOCK_TOKEN = 'mock-jwt-token';

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${MOCK_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log('🚀 Starting Chat API Diagnostic (Native HTTP)...');

    try {
        // 1. Get Channels
        console.log('\n--- 1. Testing GET /api/channels ---');
        const channels = await request('/api/channels');
        console.log(`✅ Found ${channels.length} channels`);

        // 2. Create Channel
        console.log('\n--- 2. Testing POST /api/channels ---');
        const newChannel = await request('/api/channels', 'POST', { name: 'Diag-Native', type: 'public' });
        console.log(`✅ Created channel: ${newChannel.name} (ID: ${newChannel.id})`);

        // 3. Send Message
        console.log('\n--- 3. Testing POST /api/messages/:channelId/messages ---');
        const newMessage = await request(`/api/messages/${newChannel.id}/messages`, 'POST', { text: 'Native diagnostic message' });
        console.log(`✅ Sent message: "${newMessage.text}" (ID: ${newMessage.id})`);

        // 4. Edit Message
        console.log('\n--- 4. Testing PUT /api/messages/:id ---');
        const editedMessage = await request(`/api/messages/${newMessage.id}`, 'PUT', { text: 'Native message (Edited)' });
        console.log(`✅ Edited message text to: "${editedMessage.text}"`);

        // 5. Get Messages
        console.log('\n--- 5. Testing GET /api/messages/:channelId/messages ---');
        const msgsData = await request(`/api/messages/${newChannel.id}/messages`);
        console.log(`✅ Fetched ${msgsData.messages.length} messages from diagnostic channel`);

        console.log('\n✨ Diagnostic Complete: ALL SYSTEMS GO (MOCK MODE) ✨');
    } catch (error) {
        console.error('\n❌ Diagnostic Failed:', error.message);
        process.exit(1);
    }
}

runTest();
