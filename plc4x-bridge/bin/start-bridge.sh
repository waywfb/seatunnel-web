#!/bin/bash
# Start plc4x-bridge as background process
# Usage: ./start-bridge.sh [port]

BINDIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_HOME="$(cd "$BINDIR/.." && pwd)"
JAR="$BRIDGE_HOME/target/plc4x-bridge.jar"
PORT="${1:-8081}"

if [ ! -f "$JAR" ]; then
    echo "Building bridge JAR..."
    cd "$BRIDGE_HOME" && mvn clean package -DskipTests -q
fi

PID_FILE="$BRIDGE_HOME/bridge.pid"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Bridge already running (PID $OLD_PID). Stop it first."
        exit 1
    fi
fi

nohup java -jar "$JAR" --server.port="$PORT" > "$BRIDGE_HOME/bridge.log" 2>&1 &
echo $! > "$PID_FILE"
echo "plc4x-bridge started on port $PORT (PID $!)"
