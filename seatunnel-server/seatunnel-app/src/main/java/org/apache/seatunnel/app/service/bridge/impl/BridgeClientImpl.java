package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.app.dal.dao.IDatasourceDao;
import org.apache.seatunnel.app.dal.entity.Datasource;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.BrowseNodeDTO;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.domain.response.tag.ProtocolCapabilityDTO;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.bridge.BridgeClient;
import org.apache.seatunnel.app.service.bridge.collector.CollectMode;
import org.apache.seatunnel.app.service.bridge.collector.CollectorStatus;
import org.apache.seatunnel.app.service.bridge.collector.DatasourceContext;
import org.apache.seatunnel.app.service.bridge.collector.PointCollector;
import org.apache.seatunnel.app.service.bridge.collector.PointCollectorRegistry;
import org.apache.seatunnel.app.service.bridge.collector.ReadValuesResponse;
import org.apache.seatunnel.app.service.impl.SeatunnelBaseServiceImpl;
import org.apache.seatunnel.common.access.AccessType;
import org.apache.seatunnel.common.access.ResourceType;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;
import org.apache.plc4x.java.api.model.PlcTag;
import org.apache.plc4x.java.api.types.PlcValueType;
import org.apache.plc4x.java.s7.readwrite.MemoryArea;
import org.apache.plc4x.java.s7.readwrite.tag.S7Tag;

import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.sdk.client.nodes.UaNode;
import org.eclipse.milo.opcua.sdk.client.nodes.UaVariableNode;
import org.eclipse.milo.opcua.stack.core.Identifiers;
import org.eclipse.milo.opcua.stack.core.StatusCodes;
import org.eclipse.milo.opcua.stack.core.UaException;
import org.eclipse.milo.opcua.stack.core.types.builtin.ByteString;
import org.eclipse.milo.opcua.stack.core.types.builtin.DateTime;
import org.eclipse.milo.opcua.stack.core.types.builtin.ExpandedNodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.LocalizedText;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.StatusCode;
import org.eclipse.milo.opcua.stack.core.types.builtin.Variant;
import org.eclipse.milo.opcua.stack.core.types.enumerated.NodeClass;
import org.eclipse.milo.opcua.stack.core.types.structured.ReferenceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.lang.reflect.Array;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
public class BridgeClientImpl extends SeatunnelBaseServiceImpl implements BridgeClient {

    private static final Logger LOG = LoggerFactory.getLogger(BridgeClientImpl.class);
    private static final PlcDriverManager DRIVER_MANAGER = PlcDriverManager.getDefault();
    private static final long TIMEOUT_MS = 15_000;

    /** 缓存点超过该年龄即视为 STALE（仅订阅读取使用）。 */
    private static final long DEFAULT_STALE_THRESHOLD_MS = 3_000;

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
    private final PointCollectorRegistry collectorRegistry;

    public BridgeClientImpl(
            IDatasourceDao datasourceDao, PointCollectorRegistry collectorRegistry) {
        this.datasourceDao = datasourceDao;
        this.collectorRegistry = collectorRegistry;
    }

    @Override
    public DiscoverResponseDTO discover(DiscoverRequestDTO request) {
        if (request.getDatasourceId() == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "datasourceId is required");
        }
        requireDatasourceReadPerm(request.getDatasourceId());
        ConnInfo conn =
                parseConnectionId(resolveConnectionId(String.valueOf(request.getDatasourceId())));

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
    public ReadValuesResponse read(ReadTagsRequest request) {
        if (request.getDatasourceId() == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "datasourceId is required");
        }
        requireDatasourceReadPerm(request.getDatasourceId());
        DatasourceContext ctx = buildContext(request.getDatasourceId());
        PointCollector collector = collectorRegistry.pick(ctx);
        List<TagValueDTO> values = collector.read(ctx, request.getPoints());
        CollectorStatus status = collector.status(request.getDatasourceId());
        ReadValuesResponse response = new ReadValuesResponse(values);
        response.setCollectMode(ctx.getCollectMode());
        response.setCollectorState(status.getState());
        response.setDegraded(status.isDegraded());
        response.setDegradedReason(status.getDegradedReason());
        return response;
    }

    /** 在线读值会直连 PLC，必须先校验数据源读权限；数据源不存在与无权限分别报对应错误码。 */
    private void requireDatasourceReadPerm(Long datasourceId) {
        Datasource datasource = datasourceDao.selectDatasourceById(datasourceId);
        if (datasource == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, datasourceId);
        }
        if (datasource.getDatasourceName() == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, datasourceId);
        }
        permissionCheck(
                datasource.getDatasourceName(),
                ResourceType.DATASOURCE,
                AccessType.READ,
                UserContextHolder.getAccessInfo());
    }

    private DatasourceContext buildContext(Long datasourceId) {
        String connectionId = resolveConnectionId(String.valueOf(datasourceId));
        ConnInfo conn = parseConnectionId(connectionId);
        Datasource datasource = datasourceDao.selectDatasourceById(datasourceId);
        Map<String, String> config =
                datasource == null || datasource.getDatasourceConfig() == null
                        ? Map.of()
                        : JsonUtils.toMap(datasource.getDatasourceConfig());
        return new DatasourceContext(
                datasourceId,
                datasource == null ? null : datasource.getPluginName(),
                conn.protocol,
                connectionId,
                conn.host,
                conn.port,
                datasource == null ? null : datasource.getWorkspaceId(),
                resolveCollectMode(config),
                resolveStaleThresholdMs(config));
    }

    /** 显式订阅才走订阅读取；未配置或值非法一律按轮询，运行时降级不回写配置。 */
    private CollectMode resolveCollectMode(Map<String, String> config) {
        return CollectMode.SUBSCRIPTION.name().equalsIgnoreCase(config.get("collectMode"))
                ? CollectMode.SUBSCRIPTION
                : CollectMode.POLLING;
    }

    private long resolveStaleThresholdMs(Map<String, String> config) {
        try {
            int configured = Integer.parseInt(config.get("staleThresholdMs"));
            if (configured > 0) {
                return configured;
            }
        } catch (NumberFormatException | NullPointerException ignored) {
            // 未配置或非法，走默认值
        }
        return DEFAULT_STALE_THRESHOLD_MS;
    }

    /**
     * 归一化 S7 地址：补 {@code %} 前缀、给 BOOL 补 bit offset、缺类型后缀时用 dataType 补全。
     *
     * <p>PLC4X 的 S7 地址语法为 {@code %DB<块>:<字节>[.<位>]:<类型>} 或 {@code %<区><字节>[.<位>]:<类型>}， 其中 BOOL 必须带
     * bit offset（{@code %M100:BOOL} 非法，需要 {@code %M100.0:BOOL}）。是否缺类型后缀交由驱动判断：{@code :} 同时用作块号与偏移
     * 的分隔符，数冒号并不可靠。
     */
    static String normalizeS7Address(String rawAddress, String dataType) {
        if (rawAddress == null || rawAddress.trim().isEmpty()) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "缺少 S7 测点地址");
        }
        String address = rawAddress.trim();
        if (!address.startsWith("%")) {
            address = "%" + address;
        }
        int typeSeparator = address.lastIndexOf(':');
        if (typeSeparator > 0
                && address.substring(typeSeparator + 1).equalsIgnoreCase("BOOL")
                && address.lastIndexOf('.') < typeSeparator) {
            address = address.substring(0, typeSeparator) + ".0" + address.substring(typeSeparator);
        }
        if (!isS7Address(address)) {
            String withType = address + ":" + s7PlcDataType(dataType);
            if (isS7Address(withType)) {
                return withType;
            }
        }
        return address;
    }

    static boolean isS7Address(String address) {
        try {
            S7Tag.of(address);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static String s7PlcDataType(String dataType) {
        if (dataType == null || dataType.isEmpty()) {
            return "INT";
        }
        String type = dataType.toUpperCase(Locale.ROOT);
        switch (type) {
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
            case "UINT64":
                return "ULINT";
            case "FLOAT32":
                return "REAL";
            case "FLOAT64":
                return "LREAL";
            default:
                return type;
        }
    }

    /**
     * 归一化 OPC UA 节点地址。
     *
     * <p>Milo 的 {@code NodeId.toParseableString()} 可能返回 {@code nsu=http://...;ns=2;s=Foo}，而 {@link
     * #parseOpcUaNodeId(String)} 只识别 {@code ns=2;s=Foo} 形式，因此这里丢掉 nsu 前缀。
     */
    static String normalizeOpcUaAddress(String rawAddress) {
        if (rawAddress == null || rawAddress.trim().isEmpty()) {
            throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "缺少 OPC UA 节点地址");
        }
        String address = rawAddress.trim();
        if (address.startsWith("%")) {
            address = address.substring(1);
        }
        if (address.startsWith("nsu=")) {
            int nsIndex = address.indexOf(";ns=");
            if (nsIndex < 0) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "无法解析 OPC UA 节点地址: " + rawAddress);
            }
            address = address.substring(nsIndex + 1);
        }
        return address;
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

    static NodeId parseOpcUaNodeId(String nativeId) {
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

    static String opcUaObjectToString(Object value) {
        if (value == null) {
            return null;
        }
        // 时间类型：直接 toString 会输出 DateTime{utcTime=..., javaDate=...} 这种内部结构。
        if (value instanceof DateTime) {
            DateTime dateTime = (DateTime) value;
            return dateTime.isNull() ? null : formatInstant(dateTime.getJavaInstant());
        }
        if (value instanceof Date) {
            return formatInstant(((Date) value).toInstant());
        }
        if (value instanceof Instant) {
            return formatInstant((Instant) value);
        }
        if (value instanceof OffsetDateTime) {
            return formatInstant(((OffsetDateTime) value).toInstant());
        }
        if (value instanceof ZonedDateTime) {
            return formatInstant(((ZonedDateTime) value).toInstant());
        }
        if (value instanceof LocalDateTime) {
            return LOCAL_DATE_TIME_FORMAT.format((LocalDateTime) value);
        }
        if (value instanceof LocalDate) {
            return LOCAL_DATE_TIME_FORMAT.format(
                    LocalDateTime.of((LocalDate) value, LocalTime.MIDNIGHT));
        }
        if (value instanceof LocalizedText) {
            return ((LocalizedText) value).getText();
        }
        if (value instanceof byte[]) {
            return toHex((byte[]) value);
        }
        if (value instanceof ByteString) {
            ByteString byteString = (ByteString) value;
            return byteString.isNullOrEmpty() ? "" : toHex(byteString.bytes());
        }
        if (value instanceof NodeId) {
            return ((NodeId) value).toParseableString();
        }
        if (value instanceof ExpandedNodeId) {
            return ((ExpandedNodeId) value).toParseableString();
        }
        if (value.getClass().isArray()) {
            // 反射处理基本类型数组：int[]/double[] 等不是 Object[]，直接 toString 会得到 [I@1a2b3c。
            int length = Array.getLength(value);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < length; i++) {
                if (i > 0) {
                    sb.append(", ");
                }
                sb.append(opcUaObjectToString(Array.get(value, i)));
            }
            return sb.append(']').toString();
        }
        return String.valueOf(value);
    }

    /** OPC UA DateTime 的原始值本身就是 UTC，按 ISO-8601 输出，便于与源系统对齐。 */
    private static final DateTimeFormatter UTC_DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    /** 无时区信息的类型（LocalDateTime/LocalDate）按本地时间输出，不带 Z 后缀。 */
    private static final DateTimeFormatter LOCAL_DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    private static String formatInstant(Instant instant) {
        return UTC_DATE_TIME_FORMAT.format(instant);
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }

    static String opcUaValueToString(Variant variant) {
        return variant == null ? null : opcUaObjectToString(variant.getValue());
    }

    static String describeOpcUaStatus(StatusCode status) {
        String code = "0x" + String.format("%08X", status.getValue());
        // StatusCodes.lookup 返回 {标识名, 描述}，描述是整句话，值列表里只展示标识名。
        return StatusCodes.lookup(status.getValue())
                .map(
                        names ->
                                (names.length > 0 && names[0] != null && !names[0].isEmpty()
                                                ? names[0]
                                                : code)
                                        + " ("
                                        + code
                                        + ")")
                .orElse("读取失败: " + code);
    }

    static String opcUaEndpoint(ConnInfo conn) {
        return "opc.tcp://" + conn.host + ":" + conn.port;
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
                    // S7Tag.getAddressString() 返回 null，只能从已解析的 tag 反推 %DB1:5:INT 形式，
                    // 否则导入的点没有可读地址，在线试读与建任务都无从下手。
                    String address = formatS7Address(item.getTag());
                    if (!isS7Address(address)) {
                        LOG.debug(
                                "Skip S7 browse item without readable address: {}", item.getName());
                        continue;
                    }
                    BrowseNodeDTO node = new BrowseNodeDTO();
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

    /** 由已解析的 {@link S7Tag} 反推 PLC4X S7 地址字符串。 */
    static String formatS7Address(PlcTag tag) {
        if (tag == null) {
            return null;
        }
        if (!(tag instanceof S7Tag)) {
            return tag.getAddressString();
        }
        S7Tag s7Tag = (S7Tag) tag;
        MemoryArea area = s7Tag.getMemoryArea();
        if (area == null || area == MemoryArea.INSTANCE_DATA_BLOCKS) {
            // PLC4X 没有 %DBI 形式的可解析地址，交由上层跳过该节点。
            return null;
        }
        StringBuilder sb = new StringBuilder("%").append(area.getShortName());
        if (area == MemoryArea.DATA_BLOCKS) {
            // 数据块是 %DB1:5:INT，其余存储区是 %M100.0:BOOL 这种紧跟偏移的写法。
            sb.append(s7Tag.getBlockNumber()).append(':');
        }
        sb.append(s7Tag.getByteOffset());
        if ("BOOL".equals(s7Tag.getPlcDataType())) {
            sb.append('.').append(s7Tag.getBitOffset());
        }
        return sb.append(':').append(s7Tag.getPlcDataType()).toString();
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

    /** 连接串只能由数据源 id 推导，杜绝调用方自带 {@code protocol://host:port} 直连任意地址。 */
    String resolveConnectionId(String connId) {
        try {
            Long datasourceId = Long.parseLong(connId);
            Datasource datasource = datasourceDao.selectDatasourceById(datasourceId);
            if (datasource == null) {
                throw new SeatunnelException(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, datasourceId);
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

    static ConnInfo parseConnectionId(String connectionId) {
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

    static final class ConnInfo {
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
