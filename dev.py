import os
import sys
import subprocess
import signal

print("=" * 60)
print("  AETHELGARD QUIZ PLATFORM - LOCAL DEVELOPMENT SERVER")
print("=" * 60)

backend_proc = None
frontend_proc = None

def cleanup(signum=None, frame=None):
    print("\n[*] Stopping development servers...")
    if frontend_proc:
        try: frontend_proc.terminate()
        except: pass
    if backend_proc:
        try: backend_proc.terminate()
        except: pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# Start backend
python_bin = sys.executable
backend_cmd = [python_bin, "-m", "uvicorn", "backend.app.main:app", "--reload", "--port", "8000"]
print("[*] Starting FastAPI on http://localhost:8000...")
backend_proc = subprocess.Popen(backend_cmd)

# Start frontend
frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
npm_cmd = "npm.cmd" if sys.platform.startswith("win") else "npm"
print("[*] Starting Next.js Dev on http://localhost:3000...")
frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)

try:
    frontend_proc.wait()
except KeyboardInterrupt:
    cleanup()
