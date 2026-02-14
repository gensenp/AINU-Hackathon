#!/usr/bin/env bash
# Run this from the project root. Usage: ./run-app.sh   or   bash run-app.sh

# Load Node version manager if present (so npm is in PATH)
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
elif [ -s "$HOME/.fnm/fnm" ]; then
  eval "$("$HOME/.fnm/fnm" env)"
fi

cd "$(dirname "$0")"

if ! command -v npm &>/dev/null; then
  echo "Error: npm not found. Install Node.js 18+ (https://nodejs.org) or enable nvm/fnm, then try again."
  exit 1
fi

echo "Node: $(node -v)  npm: $(npm -v)"
echo ""
echo "Step 1/2: Installing dependencies..."
if ! npm run install:all; then
  echo "Install failed. Try running manually: npm run install:all"
  exit 1
fi

echo ""
echo "Step 2/2: Starting server and client..."
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173  <- open this in your browser"
echo "  Press Ctrl+C to stop."
echo ""
npm run dev
