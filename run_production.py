import os
import sys
import time
import signal
import subprocess
import urllib.request
import urllib.error

# Environment configuration
PUBLIC_PORT = os.getenv("PORT", "3000")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")

print("=" * 65, flush=True)
print("  AETHELGARD PREMIUM QUIZ PLATFORM - UNIFIED PRODUCTION RUNNER", flush=True)
print("=" * 65, flush=True)
print(f"[*] Public Service Port (Render/User) : {PUBLIC_PORT}", flush=True)
print(f"[*] Internal FastAPI Backend Port     : {BACKEND_PORT}", flush=True)
print(f"[*] Operating System                  : {sys.platform}", flush=True)
print("-" * 65, flush=True)

backend_proc = None
frontend_proc = None

def cleanup(signum=None, frame=None):
    print("\n[*] Gracefully shutting down unified services...", flush=True)
    if frontend_proc:
        try:
            frontend_proc.terminate()
        except Exception:
            pass
    if backend_proc:
        try:
            backend_proc.terminate()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# 1. Start FastAPI Backend
print(f"[1/3] Starting FastAPI Backend on 127.0.0.1:{BACKEND_PORT}...", flush=True)
python_bin = sys.executable

backend_env = os.environ.copy()
backend_env["BACKEND_PORT"] = str(BACKEND_PORT)
backend_env["BACKEND_HOST"] = BACKEND_HOST

backend_cmd = [
    python_bin,
    "-m",
    "uvicorn",
    "backend.app.main:app",
    "--host",
    BACKEND_HOST,
    "--port",
    str(BACKEND_PORT),
    "--log-level",
    "info"
]

backend_proc = subprocess.Popen(backend_cmd, env=backend_env)

# 2. Wait for Backend Health Check
print("[2/3] Waiting for backend to initialize and seed database...", flush=True)
health_url = f"http://{BACKEND_HOST}:{BACKEND_PORT}/api/health"
ready = False
start_time = time.time()

while time.time() - start_time < 30:
    if backend_proc.poll() is not None:
        print("[!] ERROR: Backend process died prematurely.", flush=True)
        sys.exit(1)
    try:
        req = urllib.request.Request(health_url, headers={"User-Agent": "AethelgardSupervisor/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.getcode() == 200:
                ready = True
                print(f"[OK] Backend is healthy and ready! ({round(time.time() - start_time, 2)}s)", flush=True)
                break
    except Exception as e:
        time.sleep(0.5)

if not ready:
    print("[!] ERROR: Backend failed to respond to health checks within 30s.", flush=True)
    cleanup()

# 3. Start Next.js Frontend
print(f"[3/3] Starting Next.js Production Server on 0.0.0.0:{PUBLIC_PORT}...", flush=True)
frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

frontend_env = os.environ.copy()
frontend_env["PORT"] = str(PUBLIC_PORT)
frontend_env["BACKEND_PORT"] = str(BACKEND_PORT)
frontend_env["BACKEND_HOST"] = BACKEND_HOST
frontend_env["NODE_ENV"] = "production"

npm_cmd = "npm.cmd" if sys.platform.startswith("win") else "npm"

frontend_proc = subprocess.Popen(
    [npm_cmd, "start", "--", "-p", str(PUBLIC_PORT), "-H", "0.0.0.0"],
    cwd=frontend_dir,
    env=frontend_env
)

print("=" * 65, flush=True)
print(f"[OK] APPLICATION ONLINE AT http://localhost:{PUBLIC_PORT}", flush=True)
print(f"[OK] Frontend serving UI; Next.js proxying /api/* -> 127.0.0.1:{BACKEND_PORT}", flush=True)
print("=" * 65, flush=True)

# 4. Supervise both processes
try:
    while True:
        b_code = backend_proc.poll()
        if b_code is not None:
            print(f"[!] Backend process exited with code {b_code}", flush=True)
            cleanup()
        f_code = frontend_proc.poll()
        if f_code is not None:
            print(f"[!] Frontend process exited with code {f_code}", flush=True)
            cleanup()
        time.sleep(1)
except KeyboardInterrupt:
    cleanup()
