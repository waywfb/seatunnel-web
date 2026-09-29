package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.app.dal.dao.IDatasourceDao;
import org.apache.seatunnel.app.dal.entity.Datasource;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.BrowseNodeDTO;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.domain.response.tag.ProtocolCapabilityDTO;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.app.service.bridge.BridgeClient;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;
import org.apache.plc4x.java.api.messages.PlcReadRequest;
import org.apache.plc4x.java.api.messages.PlcReadResponse;
import org.apache.plc4x.java.api.types.PlcResponseCode;
import org.apache.plc4x.java.api.types.PlcValueType;
import org.apache.plc4x.java.api.value.PlcValue;
import org.apache.plc4x.java.modbus.base.tag.ModbusTag;

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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
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
    private static final long READ_TIMEOUT_MS = 5_000;
    private static final int READ_BATCH_SIZE = 100;

    /**
     * 在线试读的长连接缓存。
     *
     * <p>PLC4X 的 {@link PlcConnection#close()} 内部会执行 {@code
     * shutdownGracefully().awaitUninterruptibly(2000)}，即每次断开都会阻塞约 2 秒（实测 2001ms）。
     * 如果每次读值都建连-断连，一次读取固定多花 2 秒，实时轮询也无法达到秒级。 因此按连接串缓存 连接并复用，连接失效（设备重启/网络中断）时重建并重试一次。
     */
    private static final ConcurrentMap<String, PlcConnection> READ_CONNECTIONS =
            new ConcurrentHashMap<>();

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
    // Modbus — 在线试读 (probe)
    // ========================================================================

    @Override
    public List<TagValueDTO> read(ReadTagsRequest request) {
        List<ReadTagsRequest.PointRead> points = request.getPoints();
        if (request.getDatasourceId() == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "datasourceId is required");
        }
        if (points == null || points.isEmpty()) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "points is required");
        }
        if (points.size() > 1000) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "Too many points (max 1000 per request)");
        }

        List<TagValueDTO> results = new ArrayList<>(points.size());
        for (int i = 0; i < points.size(); i++) {
            results.add(new TagValueDTO(i, null, null));
        }

        String connectionId = resolveConnectionId(String.valueOf(request.getDatasourceId()));
        ConnInfo conn = parseConnectionId(connectionId);
        if (!"modbus".equals(conn.protocol)) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "在线读值当前仅支持 Modbus 数据源");
        }

        // PLUGIN_TO_BRIDGE_PROTOCOL maps Modbus -> "modbus" which PLC4X does not
        // recognize (design doc B1); the real driver protocol is "modbus-tcp".
        String connectionString = "modbus-tcp://" + conn.host + ":" + conn.port;
        PlcConnection connection = null;
        String failure = null;
        // 第一次失败后重建连接重试一次：长连接可能被设备/网络单方面断开。
        for (int attempt = 0; attempt < 2 && failure == null; attempt++) {
            try {
                connection = acquireReadConnection(connectionString);
                int start = 0;
                while (start < points.size()) {
                    int end = Math.min(start + READ_BATCH_SIZE, points.size());
                    readBatch(connection, points, results, start, end);
                    start = end;
                }
            } catch (SeatunnelException e) {
                throw e;
            } catch (Exception e) {
                LOG.warn(
                        "Modbus read failed (attempt {}) for {}:{}: {}",
                        attempt + 1,
                        conn.host,
                        conn.port,
                        e.getMessage());
                invalidateReadConnection(connectionString, connection);
                connection = null;
                failure = e.getMessage() != null ? e.getMessage() : e.toString();
                for (TagValueDTO dto : results) {
                    dto.setValue(null);
                    dto.setError(null);
                }
            }
        }
        if (failure != null) {
            // 实时轮询场景下不能抛全局错误（前端拦截器每次都弹 toast）：
            // 设备不可达时逐点写入错误，由值列展示。
            String msg = "连接失败: " + failure;
            for (TagValueDTO dto : results) {
                if (dto.getValue() == null && dto.getError() == null) {
                    dto.setError(msg);
                }
            }
        }
        return results;
    }

    private PlcConnection acquireReadConnection(String connectionString)
            throws org.apache.plc4x.java.api.exceptions.PlcConnectionException {
        PlcConnection cached = READ_CONNECTIONS.get(connectionString);
        if (cached != null && cached.isConnected()) {
            return cached;
        }
        PlcConnection fresh = DRIVER_MANAGER.getConnectionManager().getConnection(connectionString);
        PlcConnection replaced = READ_CONNECTIONS.put(connectionString, fresh);
        closeQuietly(replaced);
        return fresh;
    }

    private void invalidateReadConnection(String connectionString, PlcConnection connection) {
        if (connection != null) {
            READ_CONNECTIONS.remove(connectionString, connection);
        }
        closeQuietly(connection);
    }

    private void closeQuietly(PlcConnection connection) {
        if (connection == null) {
            return;
        }
        // close() 内部会阻塞约 2s（Netty graceful shutdown），放到后台线程，不拖慢当前请求。
        Thread closer =
                new Thread(
                        () -> {
                            try {
                                connection.close();
                            } catch (Exception e) {
                                LOG.debug("Close plc connection failed: {}", e.getMessage());
                            }
                        },
                        "plc4x-read-connection-closer");
        closer.setDaemon(true);
        closer.start();
    }

    private void readBatch(
            PlcConnection connection,
            List<ReadTagsRequest.PointRead> points,
            List<TagValueDTO> results,
            int start,
            int end) {
        PlcReadRequest.Builder builder = connection.readRequestBuilder();
        Map<String, Integer> added = new LinkedHashMap<>();
        for (int i = start; i < end; i++) {
            TagValueDTO dto = results.get(i);
            try {
                String address = buildModbusAddress(points.get(i));
                // Fail fast per-tag so one invalid address cannot sink the whole batch.
                ModbusTag.of(address);
                String name = "t" + i;
                builder.addTagAddress(name, address);
                added.put(name, i);
            } catch (Exception e) {
                dto.setValue(null);
                dto.setError(e.getMessage() != null ? e.getMessage() : "地址无效");
            }
        }
        if (added.isEmpty()) {
            return;
        }
        try {
            PlcReadResponse response =
                    builder.build().execute().get(READ_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            for (Map.Entry<String, Integer> entry : added.entrySet()) {
                String name = entry.getKey();
                TagValueDTO dto = results.get(entry.getValue());
                if (response.getResponseCode(name) == PlcResponseCode.OK) {
                    PlcValue plcValue = response.getPlcValue(name);
                    if (plcValue != null) {
                        try {
                            dto.setValue(plcValue.getString());
                        } catch (Exception convertEx) {
                            dto.setValue(String.valueOf(plcValue));
                        }
                        dto.setError(null);
                    } else {
                        dto.setValue(null);
                        dto.setError("返回值为空");
                    }
                } else {
                    dto.setValue(null);
                    dto.setError(describeResponseCode(response.getResponseCode(name)));
                }
            }
        } catch (Exception e) {
            if (!connection.isConnected()) {
                // 长连接已被对端关闭，交给上层重建连接后重试一次。
                throw new IllegalStateException("连接已断开: " + e.getMessage(), e);
            }
            LOG.warn("Modbus batch read failed: {}", e.getMessage());
            for (Integer idx : added.values()) {
                TagValueDTO dto = results.get(idx);
                dto.setValue(null);
                dto.setError("读取失败: " + e.getMessage());
            }
        }
    }

    private String buildModbusAddress(ReadTagsRequest.PointRead point) {
        Integer fcObj = point.getFunctionCode();
        if (fcObj == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "缺少功能码");
        }
        String prefix;
        switch (fcObj) {
            case 1:
                prefix = "coil:";
                break;
            case 2:
                prefix = "discrete-input:";
                break;
            case 3:
                prefix = "holding-register:";
                break;
            case 4:
                prefix = "input-register:";
                break;
            default:
                throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "不支持的功能码: " + fcObj);
        }
        Integer offset = point.getOffset();
        if (offset == null || offset < 0 || offset > 65535) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "偏移量超出范围: " + offset);
        }
        int unit = point.getUnitId() == null ? 1 : point.getUnitId();
        if (unit < 1 || unit > 247) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "从站号超出范围: " + unit);
        }
        String plcType = mapPlcDataType(fcObj, point.getDataType());
        // 32/64 位类型占 2/4 个连续寄存器，越界时设备会返回异常码 0x02 (INVALID_ADDRESS)
        int words = registerCountOf(plcType);
        if (offset + words - 1 > 65535) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN,
                    "寄存器范围超限: "
                            + plcType
                            + " 需要 "
                            + words
                            + " 个连续寄存器，起始偏移 "
                            + offset
                            + " 超过 65535");
        }
        String byteOrder = mapByteOrder(point.getByteOrder());

        // PLC4X tag address: <type>:<1-based-register>:<datatype>{unit-id:N,...}
        StringBuilder sb = new StringBuilder();
        sb.append(prefix).append(offset + 1).append(':').append(plcType);
        sb.append("{unit-id:").append(unit);
        if (byteOrder != null) {
            sb.append(",byte-order:'").append(byteOrder).append('\'');
        }
        sb.append('}');
        return sb.toString();
    }

    private String mapPlcDataType(int functionCode, String dataType) {
        if (functionCode == 1 || functionCode == 2) {
            return "BOOL";
        }
        if (dataType == null || dataType.isEmpty()) {
            return "INT";
        }
        switch (dataType) {
            case "BOOL":
                return "BOOL";
            case "INT16":
                return "INT";
            case "UINT16":
                return "UINT";
            case "INT32":
                return "DINT";
            case "UINT32":
                return "UDINT";
            case "INT64":
                return "LINT";
            case "FLOAT32":
                return "REAL";
            case "FLOAT64":
                return "LREAL";
            default:
                throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "不支持的数据类型: " + dataType);
        }
    }

    private int registerCountOf(String plcType) {
        switch (plcType) {
            case "DINT":
            case "UDINT":
            case "REAL":
                return 2;
            case "LINT":
            case "LREAL":
                return 4;
            default:
                return 1;
        }
    }

    private String describeResponseCode(PlcResponseCode code) {
        if (code == null) {
            return "设备无响应";
        }
        switch (code) {
            case INVALID_ADDRESS:
                return "地址无效(设备异常码 0x02)：起始地址或寄存器数量超出设备支持范围";
            case INVALID_DATATYPE:
                return "设备不支持该数据类型";
            case ACCESS_DENIED:
                return "设备拒绝访问：从站号或功能码不被支持";
            case REMOTE_BUSY:
                return "设备忙，请稍后重试";
            case REMOTE_ERROR:
            case INTERNAL_ERROR:
                return "设备内部错误";
            default:
                return String.valueOf(code);
        }
    }

    private String mapByteOrder(String byteOrder) {
        if (byteOrder == null || byteOrder.isEmpty()) {
            return null;
        }
        switch (byteOrder) {
            case "ABCD":
                return "BIG_ENDIAN";
            case "BADC":
                return "BIG_ENDIAN_BYTE_SWAP";
            case "CDAB":
                return "LITTLE_ENDIAN_BYTE_SWAP";
            case "DCBA":
                return "LITTLE_ENDIAN";
            default:
                return null;
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
