package org.apache.seatunnel.plc4x.bridge.service;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class Plc4xConnectionManager {

    private static final Logger log = LoggerFactory.getLogger(Plc4xConnectionManager.class);
    private static final long IDLE_TIMEOUT_MS = 300_000;

    private final PlcDriverManager driverManager = PlcDriverManager.getDefault();
    private final Map<String, ConnectionEntry> connections = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

    public Plc4xConnectionManager() {
        cleanupExecutor.scheduleAtFixedRate(this::cleanupIdleConnections, 60, 60, TimeUnit.SECONDS);
    }

    public String connect(String protocol, String host, int port, Map<String, String> params) {
        String connectionString = buildConnectionString(protocol, host, port, params);
        String connectionId = protocol + "://" + host + ":" + port;
        ConnectionEntry existing = connections.get(connectionId);
        if (existing != null && existing.connection.isConnected()) {
            existing.lastAccessTime = System.currentTimeMillis();
            log.info("Reusing existing connection: {}", connectionId);
            return connectionId;
        }
        try {
            PlcConnection connection = driverManager.getConnectionManager().getConnection(connectionString);
            connections.put(connectionId, new ConnectionEntry(connection));
            log.info("PLC connection established: {}", connectionId);
            return connectionId;
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to PLC: " + connectionString, e);
        }
    }

    public PlcConnection getConnection(String connectionId) {
        ConnectionEntry entry = connections.get(connectionId);
        if (entry == null) {
            throw new RuntimeException("No connection found: " + connectionId);
        }
        if (!entry.connection.isConnected()) {
            connections.remove(connectionId);
            throw new RuntimeException("Connection is closed: " + connectionId);
        }
        entry.lastAccessTime = System.currentTimeMillis();
        return entry.connection;
    }

    public void disconnect(String connectionId) {
        ConnectionEntry entry = connections.remove(connectionId);
        if (entry != null) {
            try {
                entry.connection.close();
                log.info("PLC connection closed: {}", connectionId);
            } catch (Exception e) {
                log.warn("Error closing connection: {}", connectionId, e);
            }
        }
    }

    public boolean isConnected(String connectionId) {
        ConnectionEntry entry = connections.get(connectionId);
        return entry != null && entry.connection.isConnected();
    }

    private String buildConnectionString(String protocol, String host, int port,
                                          Map<String, String> params) {
        switch (protocol.toLowerCase()) {
            case "s7":
                return "s7://" + host + ":" + port;
            case "modbus":
                return "modbus://" + host + ":" + port;
            case "opcua":
                return "opcua://" + host + ":" + port;
            default:
                return protocol + "://" + host + ":" + port;
        }
    }

    private void cleanupIdleConnections() {
        long now = System.currentTimeMillis();
        connections.entrySet().removeIf(entry -> {
            if (now - entry.getValue().lastAccessTime > IDLE_TIMEOUT_MS) {
                try {
                    entry.getValue().connection.close();
                    log.info("Idle connection closed: {}", entry.getKey());
                } catch (Exception e) {
                    log.warn("Error closing idle connection: {}", entry.getKey(), e);
                }
                return true;
            }
            return false;
        });
    }

    private static class ConnectionEntry {
        final PlcConnection connection;
        volatile long lastAccessTime;

        ConnectionEntry(PlcConnection connection) {
            this.connection = connection;
            this.lastAccessTime = System.currentTimeMillis();
        }
    }
}
