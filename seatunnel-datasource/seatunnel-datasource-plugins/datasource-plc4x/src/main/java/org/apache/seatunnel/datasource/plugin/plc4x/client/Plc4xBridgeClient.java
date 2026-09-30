package org.apache.seatunnel.datasource.plugin.plc4x.client;

import org.apache.seatunnel.datasource.plugin.plc4x.Plc4xDataSourceConfig;

import org.apache.plc4x.java.DefaultPlcDriverManager;
import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;

import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.stack.core.Identifiers;
import org.eclipse.milo.opcua.stack.core.types.structured.ReferenceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Direct PLC4J client that replaces the Bridge HTTP service.
 *
 * <p>Previously this class made HTTP calls to a separate {@code plc4x-bridge} service. Now it uses
 * PLC4J (and Eclipse Milo for OPC UA) to connect directly to PLCs. The constructor still accepts a
 * {@code bridgeUrl} parameter for backward compatibility, but it is ignored.
 */
public class Plc4xBridgeClient {

    private static final Logger LOG = LoggerFactory.getLogger(Plc4xBridgeClient.class);

    private static final String DRIVER_SERVICE =
            "META-INF/services/org.apache.plc4x.java.api.PlcDriver";

    /**
     * Deliberately not {@code PlcDriverManager.getDefault()}, and deliberately not pinned to {@code
     * Plc4xBridgeClient.class.getClassLoader()} either: DatasourceClassLoader delegates {@code
     * org.apache.seatunnel.datasource.plugin.*} to its parent first, so when this class itself
     * comes from the application loader (an IDE run) that loader carries the plugin's own classes
     * but not the shaded PLC4X drivers, and ServiceLoader comes up empty. Probing keeps the {@code
     * PlcDriver} interface and its implementations in one loader either way.
     */
    private static final PlcDriverManager DRIVER_MANAGER = createDriverManager();

    private static final long TIMEOUT_MS = 10_000;

    private static PlcDriverManager createDriverManager() {
        List<ClassLoader> candidates = new ArrayList<>();
        addCandidate(candidates, Thread.currentThread().getContextClassLoader());
        addCandidate(candidates, Plc4xBridgeClient.class.getClassLoader());
        for (ClassLoader candidate : candidates) {
            if (seesDriverRegistrations(candidate)) {
                LOG.info("PLC4X drivers loaded from class loader {}", candidate);
                return new DefaultPlcDriverManager(candidate);
            }
            LOG.warn("Class loader {} exposes no {}", candidate, DRIVER_SERVICE);
        }
        return new DefaultPlcDriverManager(candidates.get(candidates.size() - 1));
    }

    private static void addCandidate(List<ClassLoader> candidates, ClassLoader loader) {
        if (loader != null && !candidates.contains(loader)) {
            candidates.add(loader);
        }
    }

    private static boolean seesDriverRegistrations(ClassLoader loader) {
        try {
            List<URL> registrations = Collections.list(loader.getResources(DRIVER_SERVICE));
            registrations.forEach(url -> LOG.info("  PLC4X driver registration: {}", url));
            return !registrations.isEmpty();
        } catch (IOException e) {
            LOG.warn("Failed to read {} from {}", DRIVER_SERVICE, loader, e);
            return false;
        }
    }

    public Plc4xBridgeClient() {
        LOG.info("Plc4xBridgeClient initialized in direct mode (no Bridge service)");
    }

    /** @deprecated Keep for backward compatibility; {@code bridgeUrl} is ignored. */
    @Deprecated
    public Plc4xBridgeClient(String bridgeUrl) {
        this();
    }

    // ========================================================================
    // Public API — same signatures as before
    // ========================================================================

    public boolean testConnection(
            String protocol, String host, int port, Map<String, String> params) {
        if (isOpcUa(protocol)) {
            return testOpcUaConnection(host, port);
        }
        String connectionString = buildConnectionString(protocol, host, port, params);
        try {
            PlcConnection connection =
                    DRIVER_MANAGER.getConnectionManager().getConnection(connectionString);
            boolean connected = connection.isConnected();
            connection.close();
            LOG.info("Connection test {} for {}", connected ? "OK" : "FAILED", connectionString);
            return connected;
        } catch (Exception e) {
            LOG.warn("Connection test failed for {}: {}", connectionString, e.getMessage());
            return false;
        }
    }

    /** OPC UA 全部走 Eclipse Milo：PLC4X 的 OPC UA 驱动与部分服务端握手后 session 失效。 */
    private boolean testOpcUaConnection(String host, int port) {
        String endpointUrl = opcUaEndpoint(host, port);
        OpcUaClient client = null;
        try {
            client = OpcUaClient.create(endpointUrl);
            client.connect().get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
            LOG.info("OPC UA connection test OK for {}", endpointUrl);
            return true;
        } catch (Exception e) {
            LOG.warn("OPC UA connection test failed for {}: {}", endpointUrl, e.getMessage());
            return false;
        } finally {
            if (client != null) {
                try {
                    client.disconnect().get();
                } catch (Exception ignored) {
                    // ignore
                }
            }
        }
    }

    public List<String> listDatabases(String connectionId) {
        return Collections.singletonList("default");
    }

    public List<String> listTables(String connectionId) {
        try {
            ParsedConnId parsed = parseConnectionId(connectionId);
            List<Map<String, Object>> groups =
                    browseTags(parsed.protocol, parsed.host, parsed.port);
            List<String> tableNames = new ArrayList<>();
            for (Map<String, Object> group : groups) {
                String name = (String) group.get("groupName");
                if (name != null) {
                    tableNames.add(name);
                }
            }
            return tableNames;
        } catch (Exception e) {
            LOG.error("listTables failed for connectionId={}", connectionId, e);
            return Collections.emptyList();
        }
    }

    public List<Map<String, Object>> getFields(String connectionId, String groupName) {
        try {
            ParsedConnId parsed = parseConnectionId(connectionId);
            return browseTags(parsed.protocol, parsed.host, parsed.port);
        } catch (Exception e) {
            LOG.error("getFields failed for connectionId={}", connectionId, e);
            return Collections.emptyList();
        }
    }

    // ========================================================================
    // Internal — protocol-specific browsing
    // ========================================================================

    private List<Map<String, Object>> browseTags(String protocol, String host, int port) {
        String normalized = normalizeProtocol(protocol);
        switch (normalized) {
            case "opcua":
                return browseOpcUa(host, port);
            case "s7":
                return browseS7(host, port);
            case "modbus":
            case "modbustcp":
                LOG.info("Modbus does not support browsing");
                return Collections.emptyList();
            default:
                LOG.warn("Unsupported protocol for browsing: {}", protocol);
                return Collections.emptyList();
        }
    }

    /**
     * Browse OPC UA address space using Eclipse Milo directly. PLC4J's OPC UA driver does not
     * expose the same tree-browse API, so we use Milo (same approach as the old Bridge's
     * OpcUaBrowseProvider).
     */
    private List<Map<String, Object>> browseOpcUa(String host, int port) {
        String endpointUrl = opcUaEndpoint(host, port);
        OpcUaClient client = null;
        try {
            client = OpcUaClient.create(endpointUrl);
            client.connect().get();

            List<? extends ReferenceDescription> refs =
                    client.getAddressSpace().browse(Identifiers.ObjectsFolder);

            // Group top-level nodes by their display name
            List<Map<String, Object>> groups = new ArrayList<>();
            for (ReferenceDescription ref : refs) {
                if (ref == null || ref.getNodeId() == null) {
                    continue;
                }

                Map<String, Object> group = new LinkedHashMap<>();
                String displayName = ref.getDisplayName().getText();
                group.put("groupName", displayName != null ? displayName : "Unknown");

                List<Map<String, String>> tags = new ArrayList<>();
                Map<String, String> tag = new LinkedHashMap<>();
                tag.put("tagName", displayName != null ? displayName : "Unknown");
                tag.put("tagAddress", ref.getNodeId().toParseableString());
                tag.put("dataType", ref.getNodeClass().name());
                tags.add(tag);
                group.put("tags", tags);

                groups.add(group);
            }
            return groups;
        } catch (Exception e) {
            LOG.warn("OPC UA browse failed for {}:{}: {}", host, port, e.getMessage());
            return Collections.emptyList();
        } finally {
            if (client != null) {
                try {
                    client.disconnect().get();
                } catch (Exception ignored) {
                    // ignore
                }
            }
        }
    }

    /** Browse S7 tags using PLC4J's browse request API. */
    private List<Map<String, Object>> browseS7(String host, int port) {
        String connectionString = buildConnectionString("s7", host, port, Collections.emptyMap());
        try (PlcConnection connection =
                DRIVER_MANAGER.getConnectionManager().getConnection(connectionString)) {

            PlcBrowseRequest browseRequest = connection.browseRequestBuilder().build();
            CompletableFuture<? extends PlcBrowseResponse> future =
                    browseRequest.execute().toCompletableFuture();
            PlcBrowseResponse response = future.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);

            List<Map<String, Object>> groups = new ArrayList<>();
            for (String queryName : response.getQueryNames()) {
                Map<String, Object> group = new LinkedHashMap<>();
                group.put("groupName", queryName);

                List<Map<String, String>> tags = new ArrayList<>();
                for (PlcBrowseItem item : response.getValues(queryName)) {
                    Map<String, String> tag = new LinkedHashMap<>();
                    tag.put("tagAddress", item.getTag().getAddressString());
                    tag.put("tagName", item.getName());
                    tag.put("dataType", item.getTag().getClass().getSimpleName());
                    tags.add(tag);
                }
                group.put("tags", tags);
                groups.add(group);
            }
            return groups;
        } catch (Exception e) {
            LOG.warn("S7 browse failed for {}:{}: {}", host, port, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    static String toPlc4xProtocol(String protocol) {
        String normalized = normalizeProtocol(protocol);
        if (normalized.equals(Plc4xDataSourceConfig.MODBUS_PROTOCOL.toLowerCase())) {
            return "modbus-tcp";
        }
        return normalized;
    }

    private static String normalizeProtocol(String protocol) {
        return protocol.toLowerCase().replaceAll("[\\s_-]", "");
    }

    static boolean isOpcUa(String protocol) {
        return "opcua".equals(normalizeProtocol(protocol));
    }

    static String opcUaEndpoint(String host, int port) {
        return "opc.tcp://" + host + ":" + port;
    }

    static String buildConnectionString(
            String protocol, int defaultPort, String host, int port, Map<String, String> params) {
        String base = toPlc4xProtocol(protocol) + "://" + host + ":" + port;
        if (params != null && !params.isEmpty()) {
            StringBuilder query = new StringBuilder("?");
            for (Map.Entry<String, String> e : params.entrySet()) {
                if (e.getValue() == null || e.getValue().isEmpty()) {
                    continue;
                }
                if (query.length() > 1) {
                    query.append("&");
                }
                query.append(e.getKey())
                        .append("=")
                        .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
            }
            if (query.length() > 1) {
                base += query;
            }
        }
        return base;
    }

    private String buildConnectionString(
            String protocol, String host, int port, Map<String, String> params) {
        return buildConnectionString(protocol, 0, host, port, params);
    }

    private static ParsedConnId parseConnectionId(String connectionId) {
        // Format: "protocol://host:port"
        String[] parts = connectionId.split("://");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid connectionId: " + connectionId);
        }
        String protocol = parts[0];
        String hostPort = parts[1];
        int colonIdx = hostPort.lastIndexOf(':');
        if (colonIdx < 0) {
            throw new IllegalArgumentException("Missing port in connectionId: " + connectionId);
        }
        String host = hostPort.substring(0, colonIdx);
        int port = Integer.parseInt(hostPort.substring(colonIdx + 1));
        return new ParsedConnId(protocol, host, port);
    }

    private static final class ParsedConnId {
        final String protocol;
        final String host;
        final int port;

        ParsedConnId(String protocol, String host, int port) {
            this.protocol = protocol;
            this.host = host;
            this.port = port;
        }
    }
}
