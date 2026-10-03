
const fs = require('fs');
const path = require('path');
const https = require('https');

const mapServicePath = path.join(__dirname, '../services/mapService.ts');
const mapDataUrl = "https://www.overloadmaps.com/data/all.json";

function fetchMapData() {
    return new Promise((resolve, reject) => {
        https.get(mapDataUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function updateMaps() {
    try {
        console.log("Fetching map data from overloadmaps.com...");
        const liveData = await fetchMapData();
        console.log(`Fetched ${liveData.length} maps.`);

        const mapServiceContent = fs.readFileSync(mapServicePath, 'utf8');

        const liveMapLookup = {};
        liveData.forEach(item => {
            if (item.levels) {
                item.levels.forEach(level => {
                    const name = level.name.toLowerCase().trim();
                    let imageUrl = item.url.replace('/files/', 'https://www.overloadmaps.com/imgs/large/');
                    if (imageUrl.endsWith('.zip')) {
                        imageUrl = imageUrl.substring(0, imageUrl.length - 4) + '.jpg';
                    }
                    liveMapLookup[name] = imageUrl;
                });
            }
        });

        let updatedLines = [];
        let updateCount = 0;
        let alreadyGoodCount = 0;

        const lines = mapServiceContent.split('\n');
        for (let line of lines) {
            if (line.trim().startsWith('{ id:')) {
                const nameMatch = line.match(/name: "(.*?)",/);
                if (nameMatch) {
                    const currentName = nameMatch[1].toLowerCase().trim();
                    const liveImage = liveMapLookup[currentName];

                    if (liveImage) {
                        const imageMatch = line.match(/image: "(.*?)",/);
                        const currentImage = imageMatch ? imageMatch[1] : "";

                        if (currentImage !== liveImage) {
                            const newLine = line.replace(/image: ".*?"/, `image: "${liveImage}"`);
                            if (newLine !== line) {
                                console.log(`Updating ${nameMatch[1]}:`);
                                console.log(`  Old: ${currentImage}`);
                                console.log(`  New: ${liveImage}`);
                                line = newLine;
                                updateCount++;
                            } else {
                                alreadyGoodCount++;
                            }
                        } else {
                            alreadyGoodCount++;
                        }
                    }
                }
            }
            updatedLines.push(line);
        }

        console.log("Writing to:", mapServicePath);
        fs.writeFileSync(path.join(__dirname, '../services/mapService_updated.ts'), updatedLines.join('\n'));
        console.log(`Updated ${updateCount} map images.`);
        console.log(`${alreadyGoodCount} maps were already correct.`);

    } catch (err) {
        console.error("Error:", err);
    }
}

updateMaps();
