// Where a server is (S15). Neither the tracker's server browser nor a stored
// match says, so the place comes from words in the server's name and notes:
// the first location one of whose keywords appears as a whole word in the
// name, else in the notes (the name first, so a notes line about another place
// does not move the server). The dashboard's server map draws its dots at `x`,
// `y` (a 100x100 box); the server page, the region share and the stats worker
// use `region`.

// In the order they are drawn and stacked: west to east across North America,
// then the rest; Unknown last.
export const REGIONS = [
    { id: 'na-west', label: 'North America West' },
    { id: 'na-central', label: 'North America Central' },
    { id: 'na-east', label: 'North America East' },
    { id: 'europe', label: 'Europe' },
    { id: 'oceania', label: 'Oceania' },
    { id: 'asia', label: 'Asia' },
    { id: 'south-america', label: 'South America' },
    { id: 'unknown', label: 'Unknown' }
];
export const UNKNOWN_REGION = 'unknown';
const LABEL = new Map(REGIONS.map(r => [r.id, r.label]));
export const regionLabel = id => LABEL.get(id) || LABEL.get(UNKNOWN_REGION);

const LOCATIONS = [
    { keys: ['OTL.GG US-CENTRAL', 'DES MOINES'], x: 19, y: 30, region: 'na-central' },
    { keys: ['OTL.GG AU-SOUTHEAST', 'MELBOURNE'], x: 88, y: 82, region: 'oceania' },
    { keys: ['DESCENTFORUM.NET', 'D.CENT', 'A-GARAGE', 'FRANKFURT', 'GERMANY', 'DEUTSCHLAND'], x: 50, y: 23, region: 'europe' },
    { keys: ['NERD NAVY', 'ASHBURN', 'VIRGINIA'], x: 27, y: 31, region: 'na-east' },
    { keys: ['SEATTLE', 'WASHINGTON'], x: 9, y: 26, region: 'na-west' },
    { keys: ['SAN FRANCISCO', 'SAN JOSE', 'CALIFORNIA', 'BAY AREA'], x: 8, y: 33, region: 'na-west' },
    { keys: ['PHOENIX', 'ARIZONA'], x: 12, y: 35, region: 'na-west' },
    { keys: ['DENVER', 'COLORADO'], x: 15, y: 32, region: 'na-central' },
    { keys: ['DALLAS', 'TEXAS'], x: 18, y: 36, region: 'na-central' },
    { keys: ['CHICAGO', 'ILLINOIS'], x: 21, y: 30, region: 'na-central' },
    { keys: ['US-MN', 'MINNESOTA', 'MINNEAPOLIS'], x: 19, y: 27, region: 'na-central' },
    { keys: ['ATLANTA', 'GEORGIA'], x: 23, y: 36, region: 'na-east' },
    { keys: ['NEW YORK', 'BUFFALO', 'PISCATAWAY', 'JERSEY', 'NJ', 'NY'], x: 27, y: 29, region: 'na-east' },
    { keys: ['TORONTO', 'MONTREAL', 'QUEBEC', 'ONTARIO', 'CANADA'], x: 25, y: 27, region: 'na-east' },
    { keys: ['LONDON', 'UK', 'ENGLAND', 'BRITAIN'], x: 46, y: 21, region: 'europe' },
    { keys: ['AMSTERDAM', 'NETHERLANDS', 'NL'], x: 48, y: 22, region: 'europe' },
    { keys: ['PARIS', 'FRANCE'], x: 47, y: 25, region: 'europe' },
    { keys: ['MOSCOW', 'RUSSIA'], x: 60, y: 18, region: 'europe' },
    { keys: ['SINGAPORE', 'SG'], x: 76, y: 55, region: 'asia' },
    { keys: ['TOKYO', 'JAPAN', 'JP'], x: 88, y: 35, region: 'asia' },
    { keys: ['SYDNEY', 'AUSTRALIA', 'AU'], x: 91, y: 78, region: 'oceania' },
    { keys: ['SEOUL', 'KOREA'], x: 84, y: 33, region: 'asia' },
    { keys: ['BRAZIL', 'SAO PAULO', 'CHILE'], x: 30, y: 65, region: 'south-america' }
];
const NOWHERE = { x: 38, y: 40, region: UNKNOWN_REGION };
const escape = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// each location's keywords as whole words: "NY" in "Overload NY 1", not in "ANY"
const WORDS = LOCATIONS.map(loc => new RegExp(`\\b(?:${loc.keys.map(escape).join('|')})\\b`, 'i'));

/**
 * The location a server's name and notes name, or the middle of the map and
 * Unknown.
 * @param {string | null | undefined} name
 * @param {string | null | undefined} notes
 * @returns {{ x: number, y: number, region: string }}
 */
export function serverLocation(name, notes) {
    for (const text of [name, notes]) {
        if (!text) continue;
        const i = WORDS.findIndex(re => re.test(text));
        if (i >= 0) return LOCATIONS[i];
    }
    return NOWHERE;
}

export const regionOf = (name, notes) => serverLocation(name, notes).region;
