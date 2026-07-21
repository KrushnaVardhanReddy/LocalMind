#!/usr/bin/env python3
"""
Stitch Remote MCP Submitter for LocalMind
Interacts with the Google Stitch MCP server via mcp-remote proxy.

Usage:
  python3 stitch_submit.py --list
  python3 stitch_submit.py --create "Project Name"
  python3 stitch_submit.py --project-info <project_id>
  python3 stitch_submit.py --generate --project-id <project_id> --prompt "Prompt description..."
"""

import subprocess
import json
import time
import sys
import os
import urllib.request
import ssl

# ──────────────────────────────────────────────────────────────────────────────
# Config & API Key Resolution
# ──────────────────────────────────────────────────────────────────────────────

def _load_api_key():
    # 1. Environment variable STITCH_API_KEY
    key = os.environ.get("STITCH_API_KEY")
    if key:
        return key

    # 2. Check .env.local or .env for STITCH_API_KEY
    for envfile in [".env.local", ".env"]:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), envfile)
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("STITCH_API_KEY="):
                        return line.split("=", 1)[1].strip()

    # 3. Extract from mcp_config.json (Stitch configuration)
    mcp_config_path = os.path.expanduser("~/.gemini/antigravity/mcp_config.json")
    if os.path.exists(mcp_config_path):
        try:
            with open(mcp_config_path) as f:
                content = f.read()
            import re
            cleaned_content = re.sub(r'(?<!http:)(?<!https:)//.*', '', content)
            config = json.loads(cleaned_content)
            stitch_config = config.get("mcpServers", {}).get("stitch", {})
            headers = stitch_config.get("headers", {})
            key = headers.get("X-Goog-Api-Key") or headers.get("x-goog-api-key")
            if key:
                return key
        except Exception:
            pass

    # 4. Fallback to JULES_API_KEY
    key = os.environ.get("JULES_API_KEY")
    if key:
        return key

    for envfile in [".env.local", ".env"]:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), envfile)
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("JULES_API_KEY="):
                        return line.split("=", 1)[1].strip()

    print("❌ API key not found in environment, .env files, or mcp_config.json")
    sys.exit(1)


API_KEY = _load_api_key()
print(f"🔑 Using API Key: {API_KEY[:12]}...{API_KEY[-6:]}")

# ──────────────────────────────────────────────────────────────────────────────
# Stitch MCP Client Wrapper
# ──────────────────────────────────────────────────────────────────────────────

class StitchMCPClient:
    def __init__(self):
        print("🔗 Connecting to Stitch MCP Server via mcp-remote...")
        self.proc = subprocess.Popen(
            ["npx", "-y", "mcp-remote", "https://stitch.googleapis.com/mcp", "--header", f"X-Goog-Api-Key: {API_KEY}"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        # Wait for initialization
        time.sleep(6)
        if self.proc.poll() is not None:
            print("❌ Failed to start mcp-remote proxy!")
            print("Stderr:", self.proc.stderr.read())
            sys.exit(1)
        self.request_id = 1
        self._initialize_handshake()

    def _initialize_handshake(self):
        print("  → Sending MCP initialize request...")
        init_req = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "stitch-client",
                    "version": "1.0.0"
                }
            },
            "id": self.request_id
        }
        self._send_raw(init_req)
        init_res = self._read_raw()
        if init_res:
            print("  → Received initialize response.")
            initialized_notification = {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            }
            self._send_raw(initialized_notification)
            print("  → Sent initialized notification. MCP session ready.")
        else:
            print("  ⚠️ Warning: No initialize response received from proxy.")

    def _send_raw(self, msg):
        self.proc.stdin.write(json.dumps(msg) + "\n")
        self.proc.stdin.flush()

    def _read_raw(self, timeout=10.0):
        import select
        r, _, _ = select.select([self.proc.stdout], [], [], timeout)
        if r:
            line = self.proc.stdout.readline()
            return json.loads(line)
        return None

    def call_tool(self, name, arguments=None):
        self.request_id += 1
        req = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": name,
                "arguments": arguments or {}
            },
            "id": self.request_id
        }
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()

        while True:
            line = self.proc.stdout.readline()
            if not line:
                return None
            try:
                data = json.loads(line)
                if "id" in data and data["id"] == self.request_id:
                    return data
            except Exception:
                pass

    def close(self):
        self.proc.terminate()
        self.proc.wait()


# ──────────────────────────────────────────────────────────────────────────────
# Repo root + prompt loader
# ──────────────────────────────────────────────────────────────────────────────

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _load_prompt(relative_path):
    """Load a prompt file — returns its content or raises on missing file."""
    full_path = os.path.join(REPO_ROOT, relative_path)
    if not os.path.exists(full_path):
        print(f"❌ Prompt file not found: {full_path}")
        sys.exit(1)
    with open(full_path) as f:
        return f.read()

# ──────────────────────────────────────────────────────────────────────────────
# Phase 12 Stitch Tasks (Playwright / Frontend)
# ──────────────────────────────────────────────────────────────────────────────

STITCH_TASKS = {
    7: {
        "name": "Task 7 — Tableau-Style BI Pivot Builder",
        "wave": 1,
        "owner": "Stitch",
        "prompt_file": "docs/tasks/phase-1/task7_bi_pivot.md",
    },
    8: {
        "name": "Task 8 — Interactive Dashboard Builder",
        "wave": 1,
        "owner": "Stitch",
        "prompt_file": "docs/tasks/phase-1/task8_dashboards.md",
    },
}")
            
            if download_url:
                print("\n💡 Tip: You can download the html using curl or urllib.")
        finally:
            client.close()
        sys.exit(0)

    # 5. List Phase 12 tasks
    if "--list-phase12" in args:
        print("No Stitch tasks defined yet.")
        sys.exit(0)

    # 6. Submit a specific Phase 12 Stitch task by number
    if "--submit-task" in args:
        idx = args.index("--submit-task")
        if idx + 1 >= len(args):
            print("❌ Please specify a task number after --submit-task.")
            sys.exit(1)
        task_num = int(args[idx + 1])
        submit_stitch_task(task_num)
        sys.exit(0)

    # 7. Submit Wave 1 Phase 12 tasks (T01 + T02 in parallel)
    if "--phase12-wave1" in args:
        print("🌊 Submitting Phase 12 Wave 1 Stitch tasks (T01 + T02)...")
        print("   These are safe to run in parallel — no shared files.\n")
        for task_num in [1201, 1202]:
            submit_stitch_task(task_num)
            print()
        print("✅ Wave 1 submitted. Wait for PRs to merge before triggering Wave 2.")
        sys.exit(0)

    # 8. Submit Wave 2 Phase 12 tasks (T03 + T07)
    if "--phase12-wave2" in args:
        print("🌊 Submitting Phase 12 Wave 2 Stitch tasks (T03 + T07)...")
        print("   ⚠️  Only run after Wave 1 PRs are merged to feature/dev.\n")
        for task_num in [1203, 1207]:
            submit_stitch_task(task_num)
            print()
        print("✅ Wave 2 submitted.")
        sys.exit(0)

    print("❌ Unknown arguments. Use --help to see usage.")


if __name__ == "__main__":
    main()
