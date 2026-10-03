
import db from '../server/db.js';

console.log("--- DEBUGGING 'soup' SEARCH ---");

const term = 'soup';
const results = db.getGames(25, 0, term);

console.log(`Search term: "${term}"`);
console.log(`Results found: ${results.length}`);

if (results.length > 0) {
    console.log("--- Inspecting First 5 Results ---");
    results.slice(0, 5).forEach((row, i) => {
        const game = JSON.parse(row.details);
        console.log(`\nResult #${i + 1} (ID: ${game.id}):`);

        // Check for matches
        const levelMatch = game.settings?.level?.toLowerCase().includes(term);
        const serverMatch = game.server?.name?.toLowerCase().includes(term);
        const playerMatch = game.players?.some(p => p.name.toLowerCase().includes(term));
        const idMatch = String(game.id).includes(term);

        console.log(`   Level: "${game.settings?.level}" [Match: ${levelMatch}]`);
        console.log(`   Server: "${game.server?.name}" [Match: ${serverMatch}]`);
        console.log(`   Players: ${game.players?.map(p => p.name).join(', ')} [Match: ${playerMatch}]`);
        console.log(`   ID: ${game.id} [Match: ${idMatch}]`);

        if (!levelMatch && !serverMatch && !playerMatch && !idMatch) {
            console.log("   *** NO OBVIOUS MATCH FOUND! *** (Possible bug)");
        }
    });
} else {
    console.log("No results found for 'soup'.");
}

console.log("\n--- Comparison: Default Fetch (No Search) ---");
const defaultResults = db.getGames(1, 0); // fetching 1 just to see ID
if (defaultResults.length > 0) {
    const ids = results.map(r => JSON.parse(r.details).id);
    const defId = JSON.parse(defaultResults[0].details).id;
    console.log(`First Default Game ID: ${defId}`);
    if (ids.includes(defId)) {
        console.log("WARNING: Search results contain the most recent default game!");
    }
}
