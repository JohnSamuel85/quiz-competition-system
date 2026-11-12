import os
import sys
import time
import subprocess
import urllib.request
import json

python_bin = sys.executable
print("[*] Launching run_production.py via Python subprocess...")

proc = subprocess.Popen(
    [python_bin, "run_production.py"],
    env=dict(os.environ, PORT="3000", BACKEND_PORT="8000")
)

success = False
try:
    for attempt in range(25):
        time.sleep(1.5)
        try:
            # 1. Probe Next.js proxied API endpoint
            req = urllib.request.Request("http://127.0.0.1:3000/api/health", headers={"User-Agent": "Tester/1.0"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())
                    print("[✓] PROBE 1 SUCCESS: http://localhost:3000/api/health returned:", data)

                    # 2. Probe Next.js HTML page
                    req_page = urllib.request.Request("http://127.0.0.1:3000/", headers={"User-Agent": "Tester/1.0"})
                    with urllib.request.urlopen(req_page, timeout=2) as page_resp:
                        print(f"[✓] PROBE 2 SUCCESS: http://localhost:3000/ returned HTTP {page_resp.status}")

                    # 3. Probe rounds endpoint
                    req_rounds = urllib.request.Request("http://127.0.0.1:3000/api", headers={"User-Agent": "Tester/1.0"})
                    with urllib.request.urlopen(req_rounds, timeout=2) as api_resp:
                        print(f"[✓] PROBE 3 SUCCESS: http://localhost:3000/api returned HTTP {api_resp.status}")

                    success = True
                    break
        except Exception as e:
            print(f"[*] Waiting for server... (attempt {attempt+1}/25): {e}")

finally:
    print("[*] Terminating supervisor test process...")
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()

if success:
    print("\n=======================================================")
    print("  VERIFICATION RESULT: ALL TESTS PASSED SUCCESSFULLY! ")
    print("  Next.js and FastAPI run unified on 1 Render Web Service!")
    print("=======================================================\n")
    sys.exit(0)
else:
    print("\n[!] VERIFICATION FAILED\n")
    sys.exit(1)
