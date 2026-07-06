package org.apache.seatunnel.plc4x.bridge.service.browse;

import org.apache.seatunnel.plc4x.bridge.model.BrowseNode;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverRequest;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverResponse;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolCapability;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolType;
import org.apache.seatunnel.plc4x.bridge.service.Plc4xConnectionManager;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Component
public class S7BrowseProvider implements BrowseProvider {

    private static final Logger log = LoggerFactory.getLogger(S7BrowseProvider.class);
    private static final long TIMEOUT_MS = 10_000;

    private final Plc4xConnectionManager connectionManager;

    public S7BrowseProvider(Plc4xConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    @Override
    public ProtocolCapability capability() {
        ProtocolCapability cap = new ProtocolCapability();
        cap.setProtocol(ProtocolType.S7);
        cap.setSupportsBrowse(true);
        cap.setSupportsTree(false);
        cap.setSupportsLazy(false);
        cap.setSupportsMetadata(false);
        cap.setSupportsSubscription(false);
        return cap;
    }

    @Override
    public DiscoverResponse browse(DiscoverRequest request) {
        PlcConnection connection = connectionManager.getConnection(request.getConnectionId());

        try {
            PlcBrowseRequest plcRequest = connection.browseRequestBuilder().build();
            CompletableFuture<? extends PlcBrowseResponse> future =
                plcRequest.execute().toCompletableFuture();
            PlcBrowseResponse response = future.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);

            List<BrowseNode> nodes = new ArrayList<>();
            for (String queryName : response.getQueryNames()) {
                for (PlcBrowseItem item : response.getValues(queryName)) {
                    BrowseNode node = new BrowseNode();
                    String address = item.getTag().getAddressString();
                    node.setNativeId(address);
                    node.setAddress(address);
                    node.setDisplayName(item.getName());
                    node.setLeaf(true);
                    node.setChildren(null);

                    LinkedHashMap<String, Object> attrs = new LinkedHashMap<>();
                    attrs.put("dataType", item.getTag().getClass().getSimpleName());
                    node.setAttributes(attrs);

                    nodes.add(node);
                }
            }

            DiscoverResponse discResponse = new DiscoverResponse();
            discResponse.setCapability(capability());
            discResponse.setNodes(nodes);
            discResponse.setHasMore(false);
            discResponse.setTotal(nodes.size());
            return discResponse;
        } catch (Exception e) {
            throw new RuntimeException("S7 browse failed: " + e.getMessage(), e);
        }
    }
}
