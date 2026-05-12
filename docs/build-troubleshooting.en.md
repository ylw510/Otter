# Build troubleshooting

This document covers common **frontend (Chrome extension)** and **backend (FastAPI)** build and dependency issues for Otter. Recommended versions match the “Prerequisites” table in the repo root [README.en.md](../README.en.md).

---

## Frontend build (Chrome extension)

Paths: `extension/`; root wrappers: `npm run install:extension`, `build:extension`, `pack:extension` (same behavior as `./otter-extension.sh` on Linux/macOS).

### Recommended environment

- **Node.js 20+** (matches CI)
- Dependencies live under **`extension/node_modules`**. Run root-level `npm` scripts from the **repository root**, or use scripts inside `extension/package.json` when working from `extension/`.

### Common issues

#### 1. `npm ci` / `npm install` errors or missing scripts

- Confirm working directory: root scripts use `npm --prefix extension`. Avoid mixing two inconsistent `node_modules` trees from the wrong folder.
- If the lockfile does not match `package.json`, follow your team’s policy (e.g. `npm install` inside `extension/` and commit lockfile updates).

#### 2. `npm run pack:extension` fails on Windows

On **Windows**, packing uses **PowerShell** and .NET `System.IO.Compression` (see `extension/scripts/pack-zip.mjs`). Ensure:

- `powershell` is available (default on Windows).
- Prefer simple output paths; the script escapes `'` in paths—if something still fails, retry with a plain ASCII path.

#### 3. Linux/macOS: `zip: command not found`

On non-Windows platforms the pack step shells out to the **`zip`** utility (Info-ZIP). Install it if missing, e.g. Debian/Ubuntu: `sudo apt install zip`; macOS usually includes it.

#### 4. `sharp` install failures

`sharp` downloads prebuilt binaries per platform. Check proxy/firewall/mirror settings; rare environments may need local build prerequisites per `sharp` docs.

#### 5. Which folder to load in Chrome?

- Root **`npm run build:extension`** (or `pack`): default unpacked output is **`build/extension/`**.
- **`npm run build` only inside `extension/`**: output is **`extension/dist/`**. Load the matching folder in `chrome://extensions`.

---

## Backend build (Python / FastAPI)

Path: `server/`; requirements: `server/requirements.txt`. CI uses **Python 3.11**.

### Recommended environment

- **Python 3.11 or 3.12** (matches CI; wheels are widely available on PyPI)
- On Windows, prefer the official installer from [python.org](https://www.python.org/downloads/) rather than the Microsoft Store stub (see main README prerequisites).

### Common issues

#### 1. Windows: `pip install` stuck a long time on `pydantic-core` (documented case)

**Symptoms**

- Install takes far longer than usual, or appears stuck on:
  - `Preparing metadata (pyproject.toml)`
  - `Building wheel for pydantic-core`
- With **`pip install -v -r requirements.txt`**, you see **`pydantic_core-*.tar.gz`** (sdist) instead of a **`pydantic_core-*-cp311-win_amd64.whl`** (or cp312) wheel.

**Cause**

- **`pydantic==2.7.1`** pins a matching **`pydantic-core`** (e.g. 2.18.2). `pydantic-core` is mostly **Rust**; normally pip installs a **prebuilt wheel**.
- On some combinations (**very new Python, e.g. 3.14, on Windows**), a wheel may **not exist yet** on PyPI. pip then builds from **sdist**, pulling **maturin** and a **Rust (rustup)** toolchain and running **cargo**—slow and sensitive to toolchain prerequisites (e.g. MSVC).

**How to confirm it is the Rust/sdist path**

- Verbose log shows **`pydantic_core-*.tar.gz`**, plus **`maturin`**, **`rustc`/`rustup`**, or **`x86_64-pc-windows-msvc`**.
- While “stuck”, Task Manager may show **`rustc.exe` / `cargo.exe`** with noticeable CPU use.

**Recommended fix**

- **Recreate the venv with Python 3.11 or 3.12**, then `pip install -r requirements.txt`. You should see a **`pydantic_core-...-cp311-...win_amd64.whl`** (or cp312) download and a quick install.
- Staying on bleeding-edge Python may force source builds; you would need **Visual Studio Build Tools (MSVC + Windows SDK)** and **Rust**—still slow for day-to-day work.

#### 2. Venv exists but `run.bat` / `run.sh` says dependencies missing

Install requirements inside the venv:

```text
pip install -r requirements.txt
```

On Windows without activation: `server\.venv\Scripts\pip install -r requirements.txt` (adjust path as needed).

#### 3. Different launchers per OS

- **Linux/macOS**: `server/run.sh` (Bash).
- **Windows**: `server/run.bat` or run `uvicorn` manually after activating the venv (or via `Scripts\uvicorn.exe`).

---

If you hit a build issue not listed here, please open an Issue with **OS, exact Python/Node versions, the exact command, and logs** (`pip install -v` or npm output as appropriate; redact secrets).
