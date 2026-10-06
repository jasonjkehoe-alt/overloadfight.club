import os
import sys
import paramiko
import json
import base64

nas_password = os.environ.get('NAS_SSH_PASSWORD')
if not nas_password:
    print("Error: NAS_SSH_PASSWORD is not set", file=sys.stderr)
    sys.exit(1)

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.52', username='jkehoe', password=nas_password)

script = """
const Database = require('better-sqlite3');
const db = new Database('/app/data/tracker.db');

const games = db.prepare(`SELECT id, date, details FROM games`).all();
const dayMap = {};

for (const g of games) {
    if (!g.date) continue;
    const day = g.date.substring(0, 10);
    if (!dayMap[day]) {
        dayMap[day] = { matches: 0, pilots: new Set(), frags: 0 };
    }
    dayMap[day].matches++;
    try {
        const details = JSON.parse(g.details);
        if (Array.isArray(details.players)) {
            for (const p of details.players) {
                if (p.name) dayMap[day].pilots.add(p.name.toLowerCase());
                dayMap[day].frags += (Number(p.kills) || 0);
            }
        }
    } catch {}
}

const testThresholds = [
    { minMatches: 20, minPilots: 16, minFrags: 2000 },
    { minMatches: 18, minPilots: 16, minFrags: 2000 },
    { minMatches: 18, minPilots: 14, minFrags: 1800 },
    { minMatches: 16, minPilots: 16, minFrags: 2000 },
    { minMatches: 15, minPilots: 15, minFrags: 1800 }
];

const results = {};
for (const t of testThresholds) {
    const key = `X=${t.minMatches}_Y=${t.minPilots}_Z=${t.minFrags}`;
    const qualifyingDays = [];
    for (const [day, stats] of Object.entries(dayMap)) {
        if (stats.matches >= t.minMatches && (stats.pilots.size >= t.minPilots || stats.frags >= t.minFrags)) {
            qualifyingDays.push(day);
        }
    }
    // Group by month
    const months = {};
    for (const d of qualifyingDays) {
        const m = d.substring(0, 7);
        months[m] = (months[m] || 0) + 1;
    }
    results[key] = {
        totalDays: qualifyingDays.length,
        recentMonths: Object.entries(months).sort().slice(-8)
    };
}

console.log(JSON.stringify(results, null, 2));
"""

b64 = base64.b64encode(script.encode('utf-8')).decode('ascii')
cmd = f"sudo -S /usr/local/bin/docker exec overloadfight-club node -e \"eval(Buffer.from('{b64}', 'base64').toString('utf8'))\""
stdin, stdout, stderr = c.exec_command(cmd)
stdin.write(f'{nas_password}\n')
stdin.flush()
print(stdout.read().decode('utf-8'))
c.close()
