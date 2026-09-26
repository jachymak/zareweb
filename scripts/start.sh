#!/usr/bin/env bash
# Runs the whole project locally in one terminal: Firebase emulators in the
# background (output in .emulators.log), test data on the first run, then the
# dev server. Ctrl+C stops everything; emulator data is saved to emulator-data/.
#
# Usage: npm start              (or: bash scripts/start.sh)
#        npm start -- --seed    re-seed test data (replaces accounts, members, activity)
#
# Keep this in sync with what a normal local run needs (new seeds, services, …).
#
# Not run here — tests, in a second terminal while this runs:
#   npm run test:e2e                 all end-to-end suites (overwrites emulator data
#                                    with test data; `npm start -- --seed` resets it)
#   npm run test:e2e -- news events  selected suites
#   npm run seed:renewal             waiting-list entry awaiting renewal + its link
#   npm run build && npm run preview production build

set -euo pipefail
cd "$(dirname "$0")/.."

LOG=.emulators.log
SEED=false
[[ "${1:-}" == "--seed" ]] && SEED=true

if [[ ! -f .env ]]; then
  echo "Chybí .env — zkopíruj .env.example do .env (VITE_USE_EMULATORS=true)." >&2
  exit 1
fi
if [[ ! -d node_modules || ! -d functions/node_modules ]]; then
  echo "▸ Instaluju závislosti…"
  npm install
fi

up() { curl -s -o /dev/null "$1"; }
emulators_up() { up http://127.0.0.1:8080 && up http://127.0.0.1:9099 && up http://127.0.0.1:5001; }

EMU_PID=""
stop() {
  if [[ -n "$EMU_PID" ]] && kill -0 "$EMU_PID" 2>/dev/null; then
    echo
    echo "▸ Zastavuju emulátory a ukládám data do emulator-data/…"
    kill -INT "$EMU_PID" 2>/dev/null || true
    wait "$EMU_PID" 2>/dev/null || true
  fi
}
trap stop EXIT
trap 'exit 130' INT TERM

if emulators_up; then
  echo "▸ Emulátory už běží, používám je."
else
  # No data saved yet → seed after start.
  [[ -d emulator-data ]] || SEED=true
  echo "▸ Spouštím Firebase emulátory (výpis v $LOG)…"
  # Own process group (set -m): Ctrl+C must not reach the emulators directly —
  # a second SIGINT makes them quit without saving; stop() sends exactly one.
  set -m
  node_modules/.bin/firebase emulators:start --import=./emulator-data --export-on-exit \
    >"$LOG" 2>&1 &
  EMU_PID=$!
  set +m
  for _ in $(seq 1 120); do
    emulators_up && break
    if ! kill -0 "$EMU_PID" 2>/dev/null; then
      echo "Emulátory se nespustily:" >&2
      tail -n 30 "$LOG" >&2
      exit 1
    fi
    sleep 1
  done
  if ! emulators_up; then
    echo "Emulátory nenaběhly do 2 minut, viz $LOG." >&2
    exit 1
  fi
  echo "▸ Emulátory běží — přehled na http://127.0.0.1:4000"
fi

if $SEED; then
  echo "▸ Nahrávám testovací data…"
  npm run --silent seed
  npm run --silent seed:users
  npm run --silent seed:members
  npm run --silent seed:activity
fi

cat <<'EOF'

  Účty (heslo heslo1234): spravce@ · vedouci@ · rodic@ · cekajici@ · zamitnuty@zare.test
  Testy (v druhém terminálu): npm run test:e2e
  Konec: Ctrl+C

EOF

node_modules/.bin/vite
