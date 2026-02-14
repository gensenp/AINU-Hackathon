# Run AquaSafe on Mac

Use **two Terminal windows** (or two tabs). No extra tools needed.

---

## Step 1: Install dependencies (once per machine)

In **Terminal**, from the project folder:

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon

# Install root + server + client deps
npm install
cd server && npm install && cd ../client && npm install
cd ..
```

Or from project root:

```bash
npm run install:all
```

---

## Step 2: Start the backend

**Terminal 1:**

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon/server
npm run dev
```

Leave this running. Wait until you see:

```text
AquaSafe API running at http://localhost:5000
```

---

## Step 3: Start the frontend

**Terminal 2** (new window or tab):

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon/client
npm run dev
```

Leave this running. You should see something like:

```text
  ➜  Local:   http://localhost:5173/
```

---

## Step 4: Open the app

In your browser go to: **http://localhost:5173**

---

## If something breaks

| Problem | What to do |
|--------|------------|
| `command not found: npm` | Install Node from https://nodejs.org (LTS), then close and reopen Terminal. |
| `command not found: concurrently` | You’re in the project root; use the **two terminals** method above (Steps 2 and 3) and skip `npm run dev` at the root. |
| `address already in use :::5000` or `:::5173` | Another app is using that port. Quit the other app or stop the other terminal that’s running the server/client. |
| `gyp` / `node-gyp` / `better-sqlite3` build error | Install Xcode Command Line Tools: run `xcode-select --install` in Terminal, then run `npm install` again in the `server` folder. |
| Port 5173 in use | The client will try 5174. Open **http://localhost:5174** instead. |

---

## One command from root (optional)

After you’ve run `npm install` (or `npm run install:all`) **once** at the project root, you can use:

```bash
cd /Users/mashaye/AINU-Hackathon/AINU-Hackathon
npm run dev
```

That starts both server and client in one terminal. If you see `concurrently: command not found`, run `npm install` in the project root first, then try again.
