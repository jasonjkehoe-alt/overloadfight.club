import os
import sys
import paramiko
import json

nas_password = os.environ.get('NAS_SSH_PASSWORD')
if not nas_password:
    print("Error: NAS_SSH_PASSWORD is not set", file=sys.stderr)
    sys.exit(1)

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.52', username='jkehoe', password=nas_password)

script = """
const db = require('./server/db.js').default || require('./server/db.js');
const maxId = db.getLatestGameId.get().max_id;
const row = db.getGameById.get(maxId);
const details = JSON.parse(row.details);
console.log('KEYS:', JSON.stringify(Object.keys(details)));
console.log('SETTINGS:', JSON.stringify(details.settings));
console.log('SAMPLE_PLAYER:', JSON.stringify(details.players ? details.players[0] : null));
console.log('HAS_EVENTS:', !!details.events, 'HAS_KILLS:', !!details.kills, 'HAS_TELEMETRY:', !!details.telemetry);
"""

stdin, stdout, stderr = c.exec_command(f"sudo -S /usr/local/bin/docker exec overloadfight-club node -e \"{script}\"")
stdin.write(f'{nas_password}\n')
stdin.flush()
print(stdout.read().decode('utf-8'))
c.close()
