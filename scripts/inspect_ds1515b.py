import os
import sys
import paramiko

nas_password = os.environ.get('NAS_SSH_PASSWORD')
if not nas_password:
    print("Error: NAS_SSH_PASSWORD is not set", file=sys.stderr)
    sys.exit(1)

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.105', 22, 'jkehoe', nas_password)

def run_sudo(cmd):
    stdin, out, err = c.exec_command('sudo -S ' + cmd)
    stdin.write(f'{nas_password}\n')
    stdin.flush()
    return out.read().decode() + err.read().decode()

print(run_sudo("nginx -t"))
