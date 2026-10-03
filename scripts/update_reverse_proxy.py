import paramiko
import json
import base64

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.105', 22, 'jkehoe', 'Googlethr1ft')

def run_sudo(cmd):
    stdin, out, err = c.exec_command('sudo -S ' + cmd)
    stdin.write('Googlethr1ft\n')
    stdin.flush()
    res = out.read().decode('utf-8')
    err_res = err.read().decode('utf-8')
    return res

print("[1] Backing up ReverseProxy.json...")
run_sudo("cp /usr/syno/etc/www/ReverseProxy.json /usr/syno/etc/www/ReverseProxy.json.bak")

print("[2] Reading ReverseProxy.json...")
raw = run_sudo("cat /usr/syno/etc/www/ReverseProxy.json").strip()
data = json.loads(raw)

for k, v in data.items():
    if isinstance(v, dict) and 'frontend' in v:
        fqdn = v['frontend'].get('fqdn', '')
        if 'overloadfight' in fqdn:
            print(f"Updating backend for {fqdn} from {v['backend']['fqdn']} to 192.168.0.52")
            v['backend']['fqdn'] = '192.168.0.52'

new_json_bytes = json.dumps(data, indent=4).encode('utf-8')
b64 = base64.b64encode(new_json_bytes).decode('ascii')

run_sudo(f"python3 -c \"import base64; open('/usr/syno/etc/www/ReverseProxy.json', 'wb').write(base64.b64decode('{b64}'))\"")
print("Updated /usr/syno/etc/www/ReverseProxy.json successfully.")

print("[3] Updating nginx site config...")
conf_path = "/usr/local/etc/nginx/sites-available/772dcabe-ad89-4529-bdc3-ab83e611c910.w3conf"
run_sudo(f"cp {conf_path} {conf_path}.bak")
run_sudo(f"sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://192.168.0.52:3000;|g' {conf_path}")
print(f"Updated {conf_path}")

print("[4] Testing nginx configuration...")
test_out = run_sudo("nginx -t")
print(test_out)

print("[5] Reloading nginx...")
print(run_sudo("nginx -s reload"))
print("SUCCESS! Reverse proxy reloaded.")
