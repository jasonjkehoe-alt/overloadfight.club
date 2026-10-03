
import db from '../server/db.js';

console.log('--- RE-TESTING SEARCH ---');

const testSearch = (term) => {
    const results = db.getGames(100, 0, term);
    console.log(`SEARCH_RESULT: "${term}" -> ${results.length} matches`);
    if (results.length > 0) {
        const first = JSON.parse(results[0].details);
        console.log(`   First Match: [${first.id}] Map: ${first.settings?.level}`);
    }
};

// Test 1: Specific map
testSearch('SUB ROSA');

// Test 2: Specific player
testSearch('ZERGLING');

// Test 3: Non-existent term
testSearch('XXXXXXXXXXXXX');

// Test 4: Partial ID
testSearch('7210');

// Test 5: Empty search (null)
const all = db.getGames(100, 0);
console.log(`SEARCH_RESULT: (null) -> ${all.length} matches (Baseline)`);
