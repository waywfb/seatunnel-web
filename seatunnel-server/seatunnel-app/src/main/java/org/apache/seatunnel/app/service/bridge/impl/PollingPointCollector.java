/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.app.service.bridge.collector.CollectMode;
import org.apache.seatunnel.app.service.bridge.collector.CollectorStatus;
import org.apache.seatunnel.app.service.bridge.collector.DatasourceContext;
import org.apache.seatunnel.app.service.bridge.collector.PointCollector;
import org.apache.seatunnel.app.service.bridge.collector.PointQuality;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.PlcDriverManager;
import org.apache.plc4x.java.api.messages.PlcReadRequest;
import org.apache.plc4x.java.api.messages.PlcReadResponse;
import org.apache.plc4x.java.api.model.PlcTag;
import org.apache.plc4x.java.api.types.PlcResponseCode;
import org.apache.plc4x.java.api.value.PlcValue;
import org.apache.plc4x.java.modbus.base.tag.ModbusTag;
import org.apache.plc4x.java.s7.readwrite.tag.S7Tag;

import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.stack.core.AttributeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.DataValue;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.StatusCode;
import org.eclipse.milo.opcua.stack.core.types.enumerated.TimestampsToReturn;
import org.eclipse.milo.opcua.stack.core.types.structured.ReadResponse;
import org.eclipse.milo.opcua.stack.core.types.structured.ReadValueId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.ConnInfo;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.describeOpcUaStatus;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.normalizeOpcUaAddress;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.normalizeS7Address;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.opcUaEndpoint;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.opcUaValueToString;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.parseConnectionId;
import static org.apache.seatunnel.app.service.bridge.impl.BridgeClientImpl.parseOpcUaNodeId;

/**
 * 轮询采集器：请求时直连设备读取，行为与抽取前完全一致。
 *
 * <p>抽取自 {@link BridgeClientImpl}，仅承担"点位值怎么来"；OPC UA 走 Milo（与浏览同一条链路），Modbus/S7 走 PLC4X。
 */
@Component
public class PollingPointCollector implements PointCollector {

    private static final Logger LOG = LoggerFactory.getLogger(PollingPointCollector.class);
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

    /**
     * OPC UA 在线读值的长连接缓存（Eclipse Milo）。
     *
     * <p>OPC UA 读值不走 PLC4X：实测 PLC4X OPC UA 驱动与部分服务端握手后 session 失效（{@code BadSessionIdInvalid}），而
     * Milo 与节点浏览走的是同一条已验证可用的链路，因此读值统一用 Milo 并按 endpoint 缓存 client。 任何异常都会由上层移除缓存并重建一次。
     */
    private static final ConcurrentMap<String, OpcUaClient> OPCUA_CLIENTS =
            new ConcurrentHashMap<>();

    @Override
    public boolean supports(DatasourceContext ctx) {
        return true;
    }

    @Override
    public CollectorStatus status(Long datasourceId) {
        // 轮询无采集生命周期：读值时才建立/复用连接，恒为 POLLING + STOPPED
        return new CollectorStatus(datasourceId, CollectMode.POLLING);
    }

    @Override
    public List<TagValueDTO> read(DatasourceContext ctx, List<ReadTagsRequest.PointRead> points) {
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

        ConnInfo conn = parseConnectionId(ctx.getConnectionId());
        // OPC UA 全部走 Milo（见 readOpcUaPoints），不经过 PLC4X 连接串。
        boolean opcUa = "opcua".equals(conn.protocol);
        String connectionString = opcUa ? null : readConnectionString(conn);
        PlcConnection connection = null;
        String failure = null;
        // 第一次失败后重建连接重试一次：长连接可能被设备/网络单方面断开。
        for (int attempt = 0; attempt < 2 && failure == null; attempt++) {
            try {
                if (opcUa) {
                    readOpcUaPoints(conn, points, results);
                } else {
                    connection = acquireReadConnection(connectionString);
                    int start = 0;
                    while (start < points.size()) {
                        int end = Math.min(start + READ_BATCH_SIZE, points.size());
                        readBatch(connection, conn.protocol, points, results, start, end);
                        start = end;
                    }
                }
            } catch (SeatunnelException e) {
                throw e;
            } catch (Exception e) {
                LOG.warn(
                        "Read failed (attempt {}) for {}://{}:{}: {}",
                        attempt + 1,
                        conn.protocol,
                        conn.host,
                        conn.port,
                        e.getMessage());
                if (opcUa) {
                    invalidateOpcUaClient(conn);
                } else {
                    invalidateReadConnection(connectionString, connection);
                    connection = null;
                }
                failure = e.getMessage() != null ? e.getMessage() : e.toString();
                for (TagValueDTO dto : results) {
                    dto.setValue(null);
                    dto.setError(null);
                    dto.setQuality(PointQuality.BAD);
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
                    dto.setQuality(PointQuality.BAD);
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

    /**
     * 在线读值使用的 PLC4X 连接串。
     *
     * <p>PLUGIN_TO_BRIDGE_PROTOCOL 给出的是桥接协议名（modbus/s7/opcua），其中 Modbus 需要显式指定 TCP 传输（{@code
     * modbus-tcp}），而 S7 与 OPC UA 直接使用驱动协议名。
     */
    private String readConnectionString(ConnInfo conn) {
        String hostPort = conn.host + ":" + conn.port;
        switch (conn.protocol) {
            case "modbus":
                return "modbus-tcp://" + hostPort;
            case "s7":
                return "s7://" + hostPort;
            default:
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "在线读值暂不支持协议: " + conn.protocol);
        }
    }

    private void readBatch(
            PlcConnection connection,
            String protocol,
            List<ReadTagsRequest.PointRead> points,
            List<TagValueDTO> results,
            int start,
            int end) {
        PlcReadRequest.Builder builder = connection.readRequestBuilder();
        Map<String, Integer> added = new LinkedHashMap<>();
        for (int i = start; i < end; i++) {
            TagValueDTO dto = results.get(i);
            try {
                // Fail fast per-tag so one invalid address cannot sink the whole batch.
                PlcTag tag = buildTag(protocol, points.get(i));
                String name = "t" + i;
                builder.addTag(name, tag);
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
                        dto.setQuality(PointQuality.BAD);
                    }
                } else {
                    dto.setValue(null);
                    dto.setError(describeResponseCode(response.getResponseCode(name), protocol));
                }
            }
        } catch (Exception e) {
            if (!connection.isConnected()) {
                // 长连接已被对端关闭，交给上层重建连接后重试一次。
                throw new IllegalStateException("连接已断开: " + e.getMessage(), e);
            }
            LOG.warn("Batch read failed ({}): {}", protocol, e.getMessage());
            for (Integer idx : added.values()) {
                TagValueDTO dto = results.get(idx);
                dto.setValue(null);
                dto.setError("读取失败: " + e.getMessage());
                dto.setQuality(PointQuality.BAD);
            }
        }
    }

    private static PlcTag buildTag(String protocol, ReadTagsRequest.PointRead point) {
        switch (protocol) {
            case "modbus":
                return ModbusTag.of(buildModbusAddress(point));
            case "s7":
                return S7Tag.of(normalizeS7Address(point.getAddress(), point.getDataType()));
            default:
                throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "在线读值暂不支持协议: " + protocol);
        }
    }

    private static String buildModbusAddress(ReadTagsRequest.PointRead point) {
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

    private static String mapPlcDataType(int functionCode, String dataType) {
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

    private static int registerCountOf(String plcType) {
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

    private String describeResponseCode(PlcResponseCode code, String protocol) {
        if (code == null) {
            return "设备无响应";
        }
        boolean modbus = "modbus".equals(protocol);
        switch (code) {
            case INVALID_ADDRESS:
                return modbus ? "地址无效(设备异常码 0x02)：起始地址或寄存器数量超出设备支持范围" : "地址无效：测点地址不被设备识别";
            case INVALID_DATATYPE:
                return "设备不支持该数据类型";
            case ACCESS_DENIED:
                return modbus ? "设备拒绝访问：从站号或功能码不被支持" : "设备拒绝访问：连接或节点权限不足";
            case REMOTE_BUSY:
                return "设备忙，请稍后重试";
            case REMOTE_ERROR:
            case INTERNAL_ERROR:
                return "设备内部错误";
            default:
                return String.valueOf(code);
        }
    }

    private static String mapByteOrder(String byteOrder) {
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

    /**
     * OPC UA 在线读值：复用浏览节点同一条 Milo 链路，按 endpoint 缓存 client，异常时由上层移除缓存并重建重试一次。
     *
     * <p>地址无法解析属于单点问题，逐点写错误；读请求本身失败（连接断开/session 失效）则抛出，交给上层重建连接。
     */
    private void readOpcUaPoints(
            ConnInfo conn, List<ReadTagsRequest.PointRead> points, List<TagValueDTO> results)
            throws Exception {
        Map<Integer, NodeId> nodeIds = new LinkedHashMap<>();
        for (int i = 0; i < points.size(); i++) {
            ReadTagsRequest.PointRead point = points.get(i);
            TagValueDTO dto = results.get(i);
            try {
                NodeId nodeId = parseOpcUaNodeId(normalizeOpcUaAddress(point.getAddress()));
                if (nodeId == null) {
                    throw new SeatunnelException(
                            SeatunnelErrorEnum.UNKNOWN, "无法解析 OPC UA 节点: " + point.getAddress());
                }
                nodeIds.put(i, nodeId);
            } catch (Exception e) {
                dto.setValue(null);
                dto.setError(e.getMessage() != null ? e.getMessage() : "地址无效");
                dto.setQuality(PointQuality.BAD);
            }
        }
        if (nodeIds.isEmpty()) {
            return;
        }

        OpcUaClient client = acquireOpcUaClient(conn);
        List<Map.Entry<Integer, NodeId>> batch = new ArrayList<>(nodeIds.entrySet());
        for (int start = 0; start < batch.size(); start += READ_BATCH_SIZE) {
            int end = Math.min(start + READ_BATCH_SIZE, batch.size());
            readOpcUaBatch(client, batch.subList(start, end), results);
        }
    }

    private void readOpcUaBatch(
            OpcUaClient client, List<Map.Entry<Integer, NodeId>> batch, List<TagValueDTO> results)
            throws Exception {
        List<ReadValueId> readValueIds = new ArrayList<>(batch.size());
        for (Map.Entry<Integer, NodeId> entry : batch) {
            readValueIds.add(
                    ReadValueId.builder()
                            .nodeId(entry.getValue())
                            .attributeId(AttributeId.Value.uid())
                            .build());
        }
        ReadResponse response =
                client.read(0.0, TimestampsToReturn.Both, readValueIds)
                        .get(READ_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        DataValue[] values = response.getResults();
        for (int i = 0; i < batch.size(); i++) {
            TagValueDTO dto = results.get(batch.get(i).getKey());
            if (values == null || i >= values.length || values[i] == null) {
                dto.setValue(null);
                dto.setError("服务器未返回该测点的数据");
                dto.setQuality(PointQuality.BAD);
                continue;
            }
            DataValue dataValue = values[i];
            StatusCode status = dataValue.getStatusCode();
            if (status != null && status.isBad()) {
                dto.setValue(null);
                dto.setError(describeOpcUaStatus(status));
                dto.setQuality(PointQuality.BAD);
                continue;
            }
            String value = opcUaValueToString(dataValue.getValue());
            dto.setValue(value);
            dto.setError(value == null ? "返回值为空" : null);
            if (value == null) {
                dto.setQuality(PointQuality.BAD);
            } else {
                dto.setQuality(
                        status != null && status.isUncertain()
                                ? PointQuality.UNCERTAIN
                                : PointQuality.GOOD);
            }
            // 读请求带 TimestampsToReturn.Both，直接回填两侧时间戳供上层判断时效
            if (dataValue.getSourceTime() != null) {
                dto.setSourceTimestamp(dataValue.getSourceTime().getJavaTime());
            }
            if (dataValue.getServerTime() != null) {
                dto.setServerTimestamp(dataValue.getServerTime().getJavaTime());
            }
        }
    }

    private OpcUaClient acquireOpcUaClient(ConnInfo conn) throws Exception {
        String endpoint = opcUaEndpoint(conn);
        OpcUaClient cached = OPCUA_CLIENTS.get(endpoint);
        if (cached != null) {
            return cached;
        }
        OpcUaClient fresh = OpcUaClient.create(endpoint);
        fresh.connect().get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
        OpcUaClient replaced = OPCUA_CLIENTS.put(endpoint, fresh);
        closeOpcUaClient(replaced);
        return fresh;
    }

    private void invalidateOpcUaClient(ConnInfo conn) {
        closeOpcUaClient(OPCUA_CLIENTS.remove(opcUaEndpoint(conn)));
    }

    private void closeOpcUaClient(OpcUaClient client) {
        if (client == null) {
            return;
        }
        // disconnect() 会等待服务端确认，放后台线程，避免拖慢当前读值请求。
        Thread closer =
                new Thread(
                        () -> {
                            try {
                                client.disconnect().get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
                            } catch (Exception e) {
                                LOG.debug("Disconnect opcua client failed: {}", e.getMessage());
                            }
                        },
                        "opcua-read-client-closer");
        closer.setDaemon(true);
        closer.start();
    }
}
