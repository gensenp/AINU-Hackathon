# How to run AquaSafe locally

---

## Fix: “zsh: command not found: npm”

Node.js (which includes `npm`) isn’t installed or isn’t on your PATH in this terminal. Do one of the following.

### A. Install Node.js with the official installer (simplest)

1. Go to **https://nodejs.org**
2. Download the **LTS** version and run the installer.
3. **Quit and reopen Cursor** (or at least close the terminal and open a new one).
4. In a new terminal, run: `node -v` and `npm -v`. You should see version numbers.
5. Then run the app (see Option 1 or 2 below).

### B. You already use nvm or fnm

If you use **nvm** or **fnm**, Cursor’s terminal might not load it automatically.

- **nvm:** In the project folder run:
  ```bash
  source ~/.nvm/nvm.sh
  nvm install 18
  nvm use 18
  node -v && npm -v
  ```
- **fnm:** Run:
  ```bash
  eval "$(fnm env)"
  fnm install 18
  fnm use 18
  node -v && npm -v
  ```

Then run the app. If `npm` is still not found, open a **new** terminal tab and try again.

### C. Install with Homebrew (Mac)

```bash
brew install node
```

Then close and reopen the terminal (or open a new one) and run `npm -v`.

---

## Running the app (after npm works)

---

## Option 1: Two terminals (easiest to debug)

**Terminal 1 – backend**

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon/server
npm install
npm run dev
```

Leave this running. You should see something like: `AquaSafe API running at http://localhost:5000`

**Terminal 2 – frontend**

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon/client
npm install
npm run dev
```

Leave this running. You should see something like: `Local: http://localhost:5173`

Then open **http://localhost:5173** in your browser.

---

## Option 2: One terminal from project root

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon
npm install
cd server && npm install && cd ../client && npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Option 3: Try the script again

The script was updated to load nvm/fnm and to print clearer errors. From the project root:

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon
./run-app.sh
```

Or:

```bash
bash run-app.sh
```

---

## If a port is in use (e.g. “address already in use :::5000”)

- Quit any other copy of this app or anything else using port 5000 or 5173, or  
- Run the server on another port: `PORT=5001 npm run dev` in the `server` folder (then the client proxy may need to target 5001; see `client/vite.config.ts`).

---

## Quick check

- Backend: http://localhost:5000/api/health should return `{"ok":true,...}`  
- Frontend: http://localhost:5173 should show the map and UI  
