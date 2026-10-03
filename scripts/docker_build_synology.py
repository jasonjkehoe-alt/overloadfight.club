import paramiko
import sys
import time

hostname = "192.168.0.52"
username = "jkehoe"
password = sys.argv[1] if len(sys.argv) > 1 else ""

print(f"Connecting to {username}@{hostname}...", flush=True)
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, port=22, username=username, password=password, timeout=15)
print("Connected!", flush=True)

channel = client.invoke_shell()
time.sleep(1)

cmd = "cd /volume1/docker/overloadfight.club && sudo -S /usr/local/bin/docker-compose up -d --build\n"
channel.send(cmd)

output_buffer = ""
password_sent = False
start_time = time.time()

while True:
    if channel.recv_ready():
        raw_bytes = channel.recv(4096)
        text = raw_bytes.decode('utf-8', errors='replace')
        
        # Safely write to stdout regardless of console codepage
        try:
            sys.stdout.write(text)
            sys.stdout.flush()
        except Exception:
            safe_text = text.encode('ascii', errors='replace').decode('ascii')
            sys.stdout.write(safe_text)
            sys.stdout.flush()

        output_buffer += text

        if not password_sent and ("password" in output_buffer.lower() or "[sudo]" in output_buffer.lower()):
            channel.send(password + "\n")
            password_sent = True

    if channel.exit_status_ready():
        while channel.recv_ready():
            raw_bytes = channel.recv(4096)
            text = raw_bytes.decode('utf-8', errors='replace')
            try:
                sys.stdout.write(text)
                sys.stdout.flush()
            except Exception:
                safe_text = text.encode('ascii', errors='replace').decode('ascii')
                sys.stdout.write(safe_text)
                sys.stdout.flush()
            output_buffer += text
        break

    # Look for completion marker
    if password_sent and ("Creating overloadfight-club" in output_buffer or "Starting overloadfight-club" in output_buffer or "Recreating overloadfight-club" in output_buffer):
        if output_buffer.strip().endswith("$") or output_buffer.strip().endswith("#"):
            break

    time.sleep(0.5)
    if time.time() - start_time > 900: # 15 minutes max
        print("\nTimeout reached!", flush=True)
        break

channel.close()

# Verify running container status
print("\n--- Verifying Container Status ---", flush=True)
stdin, stdout, stderr = client.exec_command("/usr/local/bin/docker ps --filter name=overloadfight-club")
status_out = stdout.read().decode('utf-8', errors='replace')
print(status_out, flush=True)

client.close()
print("Deployment to Synology complete!", flush=True)
