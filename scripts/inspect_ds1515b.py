import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.105', 22, 'jkehoe', 'REDACTED')

def run_sudo(cmd):
    stdin, out, err = c.exec_command('sudo -S ' + cmd)
    stdin.write('REDACTED\n')
    stdin.flush()
    return out.read().decode() + err.read().decode()

print(run_sudo("nginx -t"))
