#!/bin/bash
# Stop plc4x-bridge process

BINDIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_HOME="$(cd "$BINDIR/.." && pwd)"
PID_FILE="$BRIDGE_HOME/bridge.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "No PID file found. Try: pkill -f plc4x-bridge.jar"
    exit 1
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    rm "$PID_FILE"
    echo "plc4x-bridge (PID $PID) stopped"
else
    echo "No process with PID $PID. Removing stale PID file."
    rm "$PID_FILE"
fi
