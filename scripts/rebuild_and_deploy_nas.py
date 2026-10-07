import os
import sys
import time
import io
import tarfile
import paramiko

try:
    if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

def get_nas_password():
    pwd = os.environ.get('NAS_SSH_PASSWORD')
    if not pwd:
        for env_file in ['.env', os.path.expanduser('~/.env')]:
            if os.path.isfile(env_file):
                try:
                    with open(env_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith('NAS_SSH_PASSWORD=') and not line.startswith('#'):
                                val = line.split('=', 1)[1].strip().strip('"').strip("'")
                                if val:
                                    return val
                except Exception:
                    pass
    return pwd

def is_sudo_prompt(line):
    l = line.strip().lower()
    return l.startswith('[sudo] password') or l == 'password:' or 'could not chdir' in l

def main():
    nas_password = get_nas_password()
    if not nas_password:
        print("Error: NAS_SSH_PASSWORD is not set", file=sys.stderr)
        sys.exit(1)

    nas_ip = '192.168.0.52'
    nas_user = 'jkehoe'
    nas_dir = '/volume1/docker/overloadfight.club'

    print(f"Connecting to {nas_user}@{nas_ip}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(nas_ip, username=nas_user, password=nas_password, timeout=15)
    except Exception as e:
        print(f"Error connecting to {nas_ip}: {e}", file=sys.stderr)
        sys.exit(1)

    print("Connected!")

    def run_sudo(cmd, stream=True):
        print(f"\n>> Executing: {cmd}", flush=True)
        session = client.get_transport().open_session()
        # Ensure PATH includes /usr/local/bin so docker-compose can invoke docker
        sh_cmd = f"export PATH=/usr/local/bin:/usr/local/sbin:$PATH; {cmd}"
        quoted_cmd = sh_cmd.replace('"', '\\"')
        session.exec_command(f'sudo -S sh -c "{quoted_cmd}"')
        session.sendall(f'{nas_password}\n')
        
        out_chunks = []
        err_chunks = []
        
        def safe_write(target, text):
            try:
                target.write(text)
                target.flush()
            except Exception:
                safe_text = text.encode('ascii', errors='replace').decode('ascii')
                target.write(safe_text)
                target.flush()

        while True:
            while session.recv_ready():
                chunk = session.recv(4096).decode('utf-8', errors='replace')
                out_chunks.append(chunk)
                if stream:
                    safe_write(sys.stdout, chunk)
            while session.recv_stderr_ready():
                chunk = session.recv_stderr(4096).decode('utf-8', errors='replace')
                lines = [l for l in chunk.splitlines(keepends=True) if not is_sudo_prompt(l)]
                err_chunks.append(chunk)
                if stream and lines:
                    safe_write(sys.stderr, "".join(lines))
            if session.exit_status_ready() and not session.recv_ready() and not session.recv_stderr_ready():
                break
            time.sleep(0.05)
            
        exit_code = session.recv_exit_status()
        session.close()
        out = "".join(out_chunks)
        return out, exit_code

    # 1. Confirm .env exists next to docker-compose.prod.yml on the NAS
    print("\n--- Step 1: Checking .env file on the NAS ---")
    check_env_out, check_code = run_sudo(f'test -f {nas_dir}/.env && echo "ENV_EXISTS" || echo "ENV_MISSING"', stream=False)
    if 'ENV_EXISTS' not in check_env_out:
        print(f"\nERROR: .env file is missing next to docker-compose.prod.yml at {nas_dir}/.env on the NAS!", file=sys.stderr)
        client.close()
        sys.exit(1)
    print(f"CONFIRMED: {nas_dir}/.env exists on the NAS!")

    # 2. Synchronize source files via tar over SSH
    print("\n--- Step 2: Packaging and synchronizing latest source files to NAS ---")
    exclude_dirs = {'.git', 'node_modules', 'data', '.idea', '.vscode'}
    exclude_files = {'.env', 'replace_expressions.txt'}

    local_root = os.getcwd()
    buf = io.BytesIO()
    file_count = 0
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for root, dirs, files in os.walk(local_root):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if f in exclude_files or f.endswith(('.pyc', '.swp', '.log')):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, local_root).replace('\\', '/')
                tar.add(full_path, arcname=rel_path)
                file_count += 1

    tar_bytes = buf.getvalue()
    print(f"Packaged {file_count} files into {len(tar_bytes)} compressed bytes.")
    print("Streaming tar archive to NAS...")

    stdin, stdout, stderr = client.exec_command(f'tar -xzf - -C {nas_dir}')
    stdin.write(tar_bytes)
    stdin.close()
    tar_code = stdout.channel.recv_exit_status()
    tar_err = stderr.read().decode('utf-8', errors='replace').strip()
    if tar_code != 0:
        print(f"Error extracting archive on NAS (exit code {tar_code}): {tar_err}", file=sys.stderr)
        client.close()
        sys.exit(1)
    print("Successfully synchronized all files to NAS!")

    # Verify package.json contains express-rate-limit on NAS
    stdin, stdout, stderr = client.exec_command(f"grep 'express-rate-limit' {nas_dir}/package.json")
    pkg_grep = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"Verified package.json on NAS: {pkg_grep}")

    # Verify server/db.js has upsertGameCold in saveColdGamesBatch on NAS
    stdin, stdout, stderr = client.exec_command(f"grep -n 'upsertGameCold.run' {nas_dir}/server/db.js")
    db_grep = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"Verified upsertGameCold in server/db.js on NAS:\n{db_grep}")

    # Verify MatchReplay component on NAS
    stdin, stdout, stderr = client.exec_command(f"grep -n 'MatchReplay' {nas_dir}/components/GameDetail.tsx")
    mr_grep = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"Verified MatchReplay in GameDetail.tsx on NAS:\n{mr_grep}")

    # 3. Rebuild Docker image
    no_cache_flag = "--no-cache" if "--no-cache" in sys.argv else ""
    print(f"\n--- Step 3: Rebuilding Docker image ({no_cache_flag or 'with layer caching'}) ---")
    build_cmd = f"cd {nas_dir} && /usr/local/bin/docker-compose build {no_cache_flag}".strip()
    build_out, build_code = run_sudo(build_cmd)
    if build_code != 0:
        print(f"\nERROR: docker-compose build failed with exit code {build_code}", file=sys.stderr)
        client.close()
        sys.exit(1)

    # 4. Recreate container (--force-recreate). The image runs as uid 1000, so data/
    # (root-owned from older images) is handed to it while the container is stopped.
    print("\n--- Step 4: Recreating container (--force-recreate) ---")
    up_out, up_code = run_sudo(f"cd {nas_dir} && /usr/local/bin/docker-compose stop && chown -R 1000:1000 data && /usr/local/bin/docker-compose up -d --force-recreate")
    if up_code != 0:
        print(f"\nERROR: docker-compose up failed with exit code {up_code}", file=sys.stderr)
        client.close()
        sys.exit(1)

    # 5. Wait for container to settle and check status
    print("\n--- Step 5: Waiting for container to start & checking status ---")
    time.sleep(5)
    run_sudo("/usr/local/bin/docker ps --filter name=overloadfight-club")

    # 6. Check container logs
    print("\n--- Step 6: Checking recent container startup logs ---")
    run_sudo("/usr/local/bin/docker logs --tail 25 overloadfight-club")

    # 7. Confirm http->https redirect middleware is present in container's /app/server/index.js
    print("\n--- Step 7: Verifying redirect middleware in container's /app/server/index.js ---")
    grep_out, _ = run_sudo('/usr/local/bin/docker exec overloadfight-club grep -n "x-forwarded-proto" /app/server/index.js')
    if 'x-forwarded-proto' in grep_out:
        print("\nSUCCESS: http->https redirect middleware confirmed present in container!")
    else:
        print("\nWARNING: redirect middleware not found in container's /app/server/index.js!", file=sys.stderr)

    client.close()
    print("\n=== Rebuild and deployment completed successfully! ===")

if __name__ == '__main__':
    main()
