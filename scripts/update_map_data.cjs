
const fs = require('fs');
const path = require('path');

const mapServicePath = path.join(__dirname, '../services/mapService.ts');
const newMapDataPath = path.join(__dirname, '../new_map_data.json');

try {
    const mapServiceContent = fs.readFileSync(mapServicePath, 'utf8');
    const newMapData = JSON.parse(fs.readFileSync(newMapDataPath, 'utf8'));

    // Create a lookup map for faster access and normalization
    const newMapLookup = {};
    newMapData.forEach(map => {
        // Normalize name: remove special chars, lowercase
        // But wait, the names in mapService might differ slightly (e.g. "6dof Doggystyle" vs "6DOF DOGGYSTYLE" in JSON levels)
        // The JSON has a 'levels' array with names, but no top-level name?
        // Let's look at the JSON structure again from the user prompt.
        // [ { "url": "...", "imageUrl": "...", "levels": [ { "name": "MAVERICKS" } ] } ]
        // The JSON does NOT have a top-level 'name' field. It has 'levels'.
        // We need to match based on the names in 'levels'.

        if (map.levels && map.levels.length > 0) {
            map.levels.forEach(level => {
                const normalizedName = level.name.toLowerCase().trim();
                newMapLookup[normalizedName] = map;
            });
        }
    });

    let updatedLines = [];
    let updateCount = 0;
    let downloadLinkUpdateCount = 0;

    const lines = mapServiceContent.split('\n');
    for (let line of lines) {
        // Check if this is a map entry line
        if (line.trim().startsWith('{ id:')) {
            // Extract name
            const nameMatch = line.match(/name: "(.*?)",/);
            if (nameMatch) {
                const currentName = nameMatch[1];
                const normalizedCurrentName = currentName.toLowerCase().trim();

                const newData = newMapLookup[normalizedCurrentName];

                if (newData) {
                    // Update Image
                    if (newData.imageUrl) {
                        // Regex to replace image: "..."
                        // We use a non-greedy match for the content inside quotes
                        const newLine = line.replace(/image: ".*?"/, `image: "${newData.imageUrl}"`);

                        if (newLine !== line) {
                            line = newLine;
                            updateCount++;
                        }
                    }

                    // Update Download Link if empty
                    if (line.includes('downloadLink: ""')) {
                        if (newData.url) {
                            const fullDownloadUrl = `https://overloadmaps.com${newData.url}`;
                            line = line.replace('downloadLink: ""', `downloadLink: "${fullDownloadUrl}"`);
                            downloadLinkUpdateCount++;
                        }
                    }
                }
            }
        }
        updatedLines.push(line);
    }

    fs.writeFileSync(mapServicePath, updatedLines.join('\n'));
    console.log(`Successfully updated ${updateCount} map images.`);
    console.log(`Successfully populated ${downloadLinkUpdateCount} missing download links.`);

} catch (err) {
    console.error("Error updating map data:", err);
}
