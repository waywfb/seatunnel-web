package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.app.dal.dao.IDatasourceDao;
import org.apache.seatunnel.app.dal.entity.Datasource;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.response.tag.BrowseNodeDTO;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.domain.response.tag.ProtocolCapabilityDTO;
import org.apache.seatunnel.app.service.bridge.BridgeClient;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;
import org.apache.plc4x.java.api.types.PlcValueType;

import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.sdk.client.nodes.UaNode;
import org.eclipse.milo.opcua.sdk.client.nodes.UaVariableNode;
import org.eclipse.milo.opcua.stack.core.Identifiers;
import org.eclipse.milo.opcua.stack.core.UaException;
import org.eclipse.milo.opcua.stack.core.types.builtin.ExpandedNodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.enumerated.NodeClass;
import org.eclipse.milo.opcua.stack.core.types.structured.ReferenceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Direct PLC4J/Milo implementation of BridgeClient.
 *
 * <p>Previously this class called the Bridge REST service at {@code /api/discover}. Now it connects
 * directly to PLCs using PLC4J (for S7) and Eclipse Milo (for OPC UA). The {@code bridge.base-url}
 * configuration property is no longer used.
 */
@Service
public class BridgeClientImpl implements BridgeClient {

    private static final Logger LOG = LoggerFactory.getLogger(BridgeClientImpl.class);
    private static final PlcDriverManager DRIVER_MANAGER = PlcDriverManager.getDefault();
    private static final long TIMEOUT_MS = 15_000;

    private static final Map<String, String> PLUGIN_TO_BRIDGE_PROTOCOL =
            Map.of(
                    "OPCUA", "opcua",
                    "Modbus", "modbus",
                    "S7", "s7");

    private static final Map<Integer, String> OPC_UA_TYPE_NAMES =
            Map.ofEntries(
                    Map.entry(1, "Boolean"),
                    Map.entry(2, "SByte"),
                    Map.entry(3, "Byte"),
                    Map.entry(4, "Int16"),
                    Map.entry(5, "UInt16"),
                    Map.entry(6, "Int32"),
                    Map.entry(7, "UInt32"),
                    Map.entry(8, "Int64"),
                    Map.entry(9, "UInt64"),
                    Map.entry(10, "Float"),
                    Map.entry(11, "Double"),
                    Map.entry(12, "String"),
                    Map.entry(13, "DateTime"),
                    Map.entry(15, "ByteString"),
                    Map.entry(22, "Structure"),
                    Map.entry(24, "BaseDataType"),
                    Map.entry(26, "Number"),
                    Map.entry(27, "Integer"),
                    Map.entry(28, "UInteger"),
                    Map.entry(29, "Enumeration"));

    private final IDatasourceDao datasourceDao;

    public BridgeClientImpl(IDatasourceDao datasourceDao) {
        this.datasourceDao = datasourceDao;
    }

    @Override
    public DiscoverResponseDTO discover(DiscoverRequestDTO request) {
        String connectionId = resolveConnectionId(request.getConnectionId());
        ConnInfo conn = parseConnectionId(connectionId);

        switch (conn.protocol) {
            case "opcua":
                return doOpcUaDiscover(conn, request);
            case "s7":
                return doS7Discover(conn, request);
            case "modbus":
                return modbusNotSupported();
            default:
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Unsupported protocol: " + conn.protocol);
        }
    }

    // ========================================================================
    // OPC UA — Eclipse Milo
    // ========================================================================

    private DiscoverResponseDTO doOpcUaDiscover(ConnInfo conn, DiscoverRequestDTO request) {
        String endpointUrl = "opc.tcp://" + conn.host + ":" + conn.port;
        OpcUaClient client = null;
        try {
            client = OpcUaClient.create(endpointUrl);
            client.connect().get(TIMEOUT_MS, TimeUnit.MILLISECONDS);

            NodeId browseRoot = Identifiers.ObjectsFolder;
            if (request.getParentNodeId() != null && !request.getParentNodeId().isEmpty()) {
                NodeId parsed = parseOpcUaNodeId(request.getParentNodeId());
                if (parsed != null) {
                    browseRoot = parsed;
                }
            }

            List<? extends ReferenceDescription> refs = client.getAddressSpace().browse(browseRoot);

            List<BrowseNodeDTO> nodes = new ArrayList<>();
            for (ReferenceDescription ref : refs) {
                if (ref == null || ref.getNodeId() == null) {
                    continue;
                }
                BrowseNodeDTO node = toBrowseNodeDTO(ref);
                if (node.getLeaf()) {
                    String dataType = readOpcUaDataType(client, ref.getNodeId());
                    if (dataType != null) {
                        node.getAttributes().put("dataType", dataType);
                    }
                }
                nodes.add(node);
            }

            ProtocolCapabilityDTO cap = new ProtocolCapabilityDTO();
            cap.setProtocol("opcua");
            cap.setSupportsBrowse(true);
            cap.setSupportsTree(true);
            cap.setSupportsLazy(false);
            cap.setSupportsMetadata(true);
            cap.setSupportsSubscription(false);

            DiscoverResponseDTO response = new DiscoverResponseDTO();
            response.setCapability(cap);
            response.setNodes(nodes);
            response.setHasMore(false);
            response.setTotal(nodes.size());
            return response;
        } catch (Exception e) {
            LOG.warn("OPC UA discover failed for {}:{}: {}", conn.host, conn.port, e.getMessage());
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "OPC UA discover failed: " + e.getMessage());
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

    private BrowseNodeDTO toBrowseNodeDTO(ReferenceDescription ref) {
        BrowseNodeDTO node = new BrowseNodeDTO();
        String nativeId = ref.getNodeId().toParseableString();
        node.setNativeId(nativeId);
        node.setAddress(nativeId);
        node.setDisplayName(ref.getDisplayName().getText());

        boolean isLeaf =
                ref.getNodeClass() == NodeClass.Variable
                        || ref.getNodeClass() == NodeClass.VariableType;
        node.setLeaf(isLeaf);

        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("nodeClass", ref.getNodeClass().name());
        node.setAttributes(attrs);

        return node;
    }

    private String readOpcUaDataType(OpcUaClient client, ExpandedNodeId expandedNodeId) {
        try {
            NodeId nodeId = expandedNodeId.toNodeId(null).orElse(null);
            if (nodeId == null) {
                return null;
            }
            UaVariableNode variableNode = client.getAddressSpace().getVariableNode(nodeId);
            NodeId dataType = variableNode.getDataType();
            if (dataType != null) {
                return opcUaTypeName(client, dataType);
            }
        } catch (UaException e) {
            LOG.debug("Failed to read DataType for {}: {}", expandedNodeId, e.getMessage());
        }
        return null;
    }

    private String opcUaTypeName(OpcUaClient client, NodeId typeId) {
        Object id = typeId.getIdentifier();
        if (id instanceof Number) {
            int numericId = ((Number) id).intValue();
            // ns=0;i=0 表示服务器未定义数据类型，避免显示裸数字 "0"。
            if (numericId == 0) {
                return "Unknown";
            }
            String name = OPC_UA_TYPE_NAMES.get(numericId);
            if (name != null) {
                return name;
            }
        }
        // 非标准类型回退读取 DataType 节点 BrowseName。
        try {
            UaNode typeNode = client.getAddressSpace().getNode(typeId);
            if (typeNode != null && typeNode.getBrowseName() != null) {
                String browseName = typeNode.getBrowseName().getName();
                if (browseName != null && !browseName.isEmpty()) {
                    return browseName;
                }
            }
        } catch (Exception e) {
            LOG.debug("Failed to resolve data type name for {}: {}", typeId, e.getMessage());
        }
        String s = String.valueOf(id);
        int idx = s.lastIndexOf('.');
        return idx >= 0 ? s.substring(idx + 1) : s;
    }

    private NodeId parseOpcUaNodeId(String nativeId) {
        if (nativeId == null || !nativeId.startsWith("ns=")) {
            return null;
        }
        try {
            String[] parts = nativeId.split(";");
            int ns = 0;
            for (String part : parts) {
                String trimmed = part.trim();
                if (trimmed.startsWith("ns=")) {
                    ns = Integer.parseInt(trimmed.substring(3));
                } else if (trimmed.startsWith("i=")) {
                    return new NodeId(ns, Integer.parseInt(trimmed.substring(2)));
                } else if (trimmed.startsWith("s=")) {
                    return new NodeId(ns, trimmed.substring(2));
                }
            }
        } catch (Exception e) {
            LOG.warn("Failed to parse OPC UA nodeId: {}", nativeId, e);
        }
        return null;
    }

    // ========================================================================
    // S7 — PLC4J browse
    // ========================================================================

    private DiscoverResponseDTO doS7Discover(ConnInfo conn, DiscoverRequestDTO request) {
        String connectionString = buildConnectionString("s7", conn.host, conn.port, null);
        try (PlcConnection connection =
                DRIVER_MANAGER.getConnectionManager().getConnection(connectionString)) {

            PlcBrowseRequest browseRequest = connection.browseRequestBuilder().build();
            CompletableFuture<? extends PlcBrowseResponse> future =
                    browseRequest.execute().toCompletableFuture();
            PlcBrowseResponse response = future.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);

            List<BrowseNodeDTO> nodes = new ArrayList<>();
            for (String queryName : response.getQueryNames()) {
                for (PlcBrowseItem item : response.getValues(queryName)) {
                    BrowseNodeDTO node = new BrowseNodeDTO();
                    String address = item.getTag().getAddressString();
                    node.setNativeId(address);
                    node.setAddress(address);
                    node.setDisplayName(item.getName());
                    node.setLeaf(true);

                    Map<String, Object> attrs = new LinkedHashMap<>();
                    PlcValueType plcType = item.getTag().getPlcValueType();
                    attrs.put(
                            "dataType",
                            plcType != null
                                    ? plcType.name()
                                    : item.getTag().getClass().getSimpleName());
                    node.setAttributes(attrs);

                    nodes.add(node);
                }
            }

            ProtocolCapabilityDTO cap = new ProtocolCapabilityDTO();
            cap.setProtocol("s7");
            cap.setSupportsBrowse(true);
            cap.setSupportsTree(false);
            cap.setSupportsLazy(false);
            cap.setSupportsMetadata(false);
            cap.setSupportsSubscription(false);

            DiscoverResponseDTO discResponse = new DiscoverResponseDTO();
            discResponse.setCapability(cap);
            discResponse.setNodes(nodes);
            discResponse.setHasMore(false);
            discResponse.setTotal(nodes.size());
            return discResponse;
        } catch (Exception e) {
            LOG.warn("S7 discover failed for {}:{}: {}", conn.host, conn.port, e.getMessage());
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "S7 discover failed: " + e.getMessage());
        }
    }

    // ========================================================================
    // Modbus — not supported
    // ========================================================================

    private DiscoverResponseDTO modbusNotSupported() {
        ProtocolCapabilityDTO cap = new ProtocolCapabilityDTO();
        cap.setProtocol("modbus");
        cap.setSupportsBrowse(false);
        cap.setSupportsTree(false);
        cap.setSupportsLazy(false);
        cap.setSupportsMetadata(false);
        cap.setSupportsSubscription(false);

        DiscoverResponseDTO response = new DiscoverResponseDTO();
        response.setCapability(cap);
        response.setNodes(new ArrayList<>());
        response.setHasMore(false);
        response.setTotal(0);
        return response;
    }

    // ========================================================================
    // Connection helpers
    // ========================================================================

    private String resolveConnectionId(String connId) {
        if (connId == null || connId.contains("://")) {
            return connId;
        }
        try {
            Long datasourceId = Long.parseLong(connId);
            Datasource datasource = datasourceDao.selectDatasourceById(datasourceId);
            if (datasource == null) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Datasource not found: " + datasourceId);
            }

            String pluginName = datasource.getPluginName();
            String bridgeProtocol = PLUGIN_TO_BRIDGE_PROTOCOL.get(pluginName);
            if (bridgeProtocol == null) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Unsupported datasource plugin: " + pluginName);
            }

            Map<String, String> config = JsonUtils.toMap(datasource.getDatasourceConfig());
            String host = config.get("host");
            String port = config.get("port");
            if (host == null || port == null) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Datasource config missing host or port");
            }

            return bridgeProtocol + "://" + host + ":" + port;
        } catch (NumberFormatException e) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "Invalid connectionId: " + connId);
        }
    }

    private static ConnInfo parseConnectionId(String connectionId) {
        if (connectionId == null || !connectionId.contains("://")) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN,
                    "Invalid connectionId format (expected protocol://host:port): " + connectionId);
        }
        String[] parts = connectionId.split("://");
        String protocol = parts[0].toLowerCase();
        String hostPort = parts[1];
        int colonIdx = hostPort.lastIndexOf(':');
        if (colonIdx < 0) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "Missing port in connectionId: " + connectionId);
        }
        String host = hostPort.substring(0, colonIdx);
        int port = Integer.parseInt(hostPort.substring(colonIdx + 1));
        return new ConnInfo(protocol, host, port);
    }

    static String buildConnectionString(
            String protocol, String host, int port, Map<String, String> params) {
        String base = protocol.toLowerCase().replaceAll("[\\s-]", "") + "://" + host + ":" + port;
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

    private static final class ConnInfo {
        final String protocol;
        final String host;
        final int port;

        ConnInfo(String protocol, String host, int port) {
            this.protocol = protocol;
            this.host = host;
            this.port = port;
        }
    }
}
