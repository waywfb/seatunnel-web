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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BridgeClientImpl implements BridgeClient {

    private static final Logger log = LoggerFactory.getLogger(BridgeClientImpl.class);

    private static final Map<String, String> PLUGIN_TO_BRIDGE_PROTOCOL =
            Map.of(
                    "OPCUA", "opcua",
                    "Modbus", "modbus",
                    "S7", "s7");

    private final RestTemplate restTemplate;
    private final IDatasourceDao datasourceDao;

    @Value("${bridge.base-url:http://localhost:51999}")
    private String bridgeBaseUrl;

    public BridgeClientImpl(RestTemplate restTemplate, IDatasourceDao datasourceDao) {
        this.restTemplate = restTemplate;
        this.datasourceDao = datasourceDao;
    }

    @Override
    public DiscoverResponseDTO discover(DiscoverRequestDTO request) {
        String bridgeConnectionId = resolveConnectionId(request.getConnectionId());

        Map<String, Object> bridgeRequest = new HashMap<>();
        bridgeRequest.put("connectionId", bridgeConnectionId);
        bridgeRequest.put("parentNodeId", request.getParentNodeId());
        bridgeRequest.put("limit", request.getLimit());
        bridgeRequest.put("offset", request.getOffset());

        String url = bridgeBaseUrl + "/api/discover";
        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, bridgeRequest, Map.class);
            Map body = response.getBody();
            if (body == null) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Bridge returned empty response");
            }
            int code = (int) body.getOrDefault("code", 500);
            if (code != 200) {
                String msg = (String) body.getOrDefault("message", "Bridge error");
                throw new SeatunnelException(
                        SeatunnelErrorEnum.UNKNOWN, "Bridge discover failed: " + msg);
            }
            Map data = (Map) body.get("data");
            if (data == null) {
                throw new SeatunnelException(SeatunnelErrorEnum.UNKNOWN, "Bridge returned no data");
            }
            return convertResponse(data);
        } catch (RestClientException e) {
            log.error("Bridge call failed", e);
            throw new SeatunnelException(
                    SeatunnelErrorEnum.UNKNOWN, "Bridge unavailable: " + e.getMessage());
        }
    }

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

    private DiscoverResponseDTO convertResponse(Map data) {
        DiscoverResponseDTO r = new DiscoverResponseDTO();
        if (data.containsKey("capability") && data.get("capability") instanceof Map) {
            Map cap = (Map) data.get("capability");
            ProtocolCapabilityDTO pc = new ProtocolCapabilityDTO();
            pc.setProtocol((String) cap.getOrDefault("protocol", ""));
            pc.setSupportsBrowse((boolean) cap.getOrDefault("supportsBrowse", false));
            pc.setSupportsTree((boolean) cap.getOrDefault("supportsTree", false));
            pc.setSupportsLazy((boolean) cap.getOrDefault("supportsLazy", false));
            pc.setSupportsMetadata((boolean) cap.getOrDefault("supportsMetadata", false));
            pc.setSupportsSubscription((boolean) cap.getOrDefault("supportsSubscription", false));
            r.setCapability(pc);
        }
        r.setNodes(convertNodes((List<Map>) data.get("nodes")));
        r.setHasMore((Boolean) data.get("hasMore"));
        if (data.containsKey("total")) {
            r.setTotal((Integer) data.get("total"));
        }
        return r;
    }

    private List<BrowseNodeDTO> convertNodes(List<Map> nodes) {
        if (nodes == null) return null;
        List<BrowseNodeDTO> result = new ArrayList<>();
        for (Map node : nodes) {
            BrowseNodeDTO n = new BrowseNodeDTO();
            n.setNativeId((String) node.get("nativeId"));
            n.setAddress((String) node.get("address"));
            n.setDisplayName((String) node.get("displayName"));
            n.setLeaf((Boolean) node.get("leaf"));
            n.setAttributes((Map) node.get("attributes"));
            if (node.containsKey("children") && node.get("children") instanceof List) {
                n.setChildren(convertNodes((List<Map>) node.get("children")));
            }
            result.add(n);
        }
        return result;
    }
}
