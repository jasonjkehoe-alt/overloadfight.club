import paramiko
import json

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.52', username='jkehoe', password='REDACTED')

script = """
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database('/app/data/tracker.db');

// Query games from hot DB
const games = db.prepare(`SELECT id, date, details FROM games ORDER BY date DESC LIMIT 2000`).all();
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

const days = Object.keys(dayMap).sort().reverse().slice(0, 60);
const summary = days.map(d => ({
    date: d,
    matches: dayMap[d].matches,
    pilots: dayMap[d].pilots.size,
    frags: dayMap[d].frags
}));

console.log(JSON.stringify(summary, null, 2));
"""

import base64
b64 = base64.b64encode(script.encode('utf-8')).decode('ascii')
cmd = f"sudo -S /usr/local/bin/docker exec overloadfight-club node -e \"eval(Buffer.from('{b64}', 'base64').toString('utf8'))\""
stdin, stdout, stderr = c.exec_command(cmd)
stdin.write('REDACTED\n')
stdin.flush()
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("STDOUT:", out)
print("STDERR:", err)
c.close()
