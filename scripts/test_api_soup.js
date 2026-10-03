
import axios from 'axios';

const ENDPOINTS = [
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api',
    'http://[::1]:3000/api',
    'http://localhost:5173/api' // Vite Proxy
];

async function testEndpoint(baseUrl) {
    const term = 'soup';
    const url = `${baseUrl}/games?page=1&search=${term}`;
    console.log(`\nTesting: ${url}`);

    try {
        const response = await axios.get(url, { timeout: 2000 });
        const { games, count } = response.data;
        console.log(`SUCCESS [${baseUrl}]`);
        console.log(`Status: ${response.status}`);
        console.log(`Count: ${count}`);
        console.log(`Games Returned: ${games.length}`);

        if (games.length > 0) {
            const first = games[0];
            const json = JSON.stringify(first).toLowerCase();
            const match = json.includes(term.toLowerCase());
            console.log(`First Game ID: ${first.id}`);
            console.log(`Match "soup"? ${match}`);
        }
    } catch (e) {
        console.log(`FAILED [${baseUrl}]: ${e.message}`);
    }
}

async function run() {
    console.log("--- SEARCH CONNECTIVITY TEST ---");
    for (const ep of ENDPOINTS) {
        await testEndpoint(ep);
    }
}

run();
