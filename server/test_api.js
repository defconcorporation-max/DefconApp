
// import fetch from 'node-fetch'; // Native fetch available in Node 18+

const API_URL = 'http://localhost:3000/api';

async function test() {
    console.log('--- Starting API Test ---');

    // 1. Login
    console.log('Logging in as admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const { token } = await loginRes.json();
    console.log('Login successful. Token obtained.');

    // 2. Create Client
    console.log('Creating test client...');
    const clientData = {
        name: 'Test Client ' + Date.now(),
        email: 'test@example.com'
    };

    const createRes = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
    });

    if (!createRes.ok) {
        console.error('Create client failed:', await createRes.text());
        return;
    }

    const createJson = await createRes.json();
    console.log('Client created. Response:', createJson);
    const newClientId = createJson.id; // This might be _id or id depending on existing logic

    // 3. Get All Clients to see how it looks in list
    console.log('Fetching client list...');
    const listRes = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const clients = await listRes.json();
    const createdClient = clients.find(c => c.name === clientData.name);

    if (!createdClient) {
        console.error('Created client not found in list!');
        return;
    }

    console.log('Client found in list:', {
        name: createdClient.name,
        id: createdClient.id,
        _id: createdClient._id
    });

    // 4. Fetch Client by ID (using the ID from list)
    console.log(`Fetching client by ID: ${createdClient.id}...`);
    const getRes = await fetch(`${API_URL}/clients/${createdClient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (getRes.ok) {
        const clientDetails = await getRes.json();
        console.log('SUCCESS: Client fetched by ID.', clientDetails.name);
    } else {
        console.error('FAILURE: Fetch by ID failed:', await getRes.status, await getRes.text());
    }

    // 5. Fetch Client by _id (if different)
    if (createdClient._id && createdClient._id !== createdClient.id) {
        console.log(`Fetching client by _id: ${createdClient._id}...`);
        const getRes2 = await fetch(`${API_URL}/clients/${createdClient._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (getRes2.ok) {
            const clientDetails2 = await getRes2.json();
            console.log('SUCCESS: Client fetched by _id.', clientDetails2.name);
        } else {
            console.error('FAILURE: Fetch by _id failed:', await getRes2.status, await getRes2.text());
        }
    }
}

test();
