package org.apache.seatunnel.plc4x.bridge.service.browse;

import org.apache.seatunnel.plc4x.bridge.exception.BridgeException;
import org.apache.seatunnel.plc4x.bridge.model.BridgeErrorCode;
import org.apache.seatunnel.plc4x.bridge.model.BrowseNode;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverRequest;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverResponse;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolCapability;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolType;

import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.stack.core.Identifiers;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.Unsigned;
import org.eclipse.milo.opcua.stack.core.types.enumerated.BrowseDirection;
import org.eclipse.milo.opcua.stack.core.types.enumerated.NodeClass;
import org.eclipse.milo.opcua.stack.core.types.structured.BrowseDescription;
import org.eclipse.milo.opcua.stack.core.types.structured.BrowseResponse;
import org.eclipse.milo.opcua.stack.core.types.structured.BrowseResult;
import org.eclipse.milo.opcua.stack.core.types.structured.ReferenceDescription;
import org.eclipse.milo.opcua.stack.core.types.structured.ViewDescription;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Component
public class OpcUaBrowseProvider implements BrowseProvider {

    private static final Logger log = LoggerFactory.getLogger(OpcUaBrowseProvider.class);

    @Override
    public ProtocolCapability capability() {
        ProtocolCapability cap = new ProtocolCapability();
        cap.setProtocol(ProtocolType.OPCUA);
        cap.setSupportsBrowse(true);
        cap.setSupportsTree(true);
        cap.setSupportsLazy(true);
        cap.setSupportsMetadata(true);
        cap.setSupportsSubscription(true);
        return cap;
    }

    @Override
    public DiscoverResponse browse(DiscoverRequest request) {
        String connectionId = request.getConnectionId();
        String endpointUrl = buildEndpointUrl(connectionId);

        try {
            OpcUaClient client = OpcUaClient.create(endpointUrl);
            client.connect().get();

            NodeId browseRoot;
            if (request.getParentNodeId() != null && !request.getParentNodeId().isEmpty()) {
                browseRoot = parseNodeId(request.getParentNodeId());
            } else {
                browseRoot = Identifiers.ObjectsFolder;
            }

            List<BrowseNode> nodes = browseChildren(client, browseRoot);

            client.disconnect().get();

            DiscoverResponse response = new DiscoverResponse();
            response.setCapability(capability());
            response.setNodes(nodes);
            response.setHasMore(false);
            response.setTotal(nodes.size());
            return response;
        } catch (Exception e) {
            throw new BridgeException(BridgeErrorCode.PLC_CONNECTION_FAILED,
                "OPC UA browse failed: " + e.getMessage());
        }
    }

    private List<BrowseNode> browseChildren(OpcUaClient client, NodeId parent) throws Exception {
        BrowseDescription browse = new BrowseDescription(
            parent,
            BrowseDirection.Forward,
            Identifiers.References,
            true,
            Unsigned.uint(0),
            Unsigned.uint(0)
        );

        CompletableFuture<List<BrowseNode>> future = client.browse(
            new ViewDescription(Identifiers.ObjectsFolder, null, Unsigned.uint(0)),
            Unsigned.uint(0),
            Collections.singletonList(browse)
        ).thenApply(response -> {
            List<BrowseNode> nodeList = new ArrayList<>();
            BrowseResult[] results = response.getResults();
            if (results != null) {
                for (BrowseResult br : results) {
                    if (br.getReferences() == null) continue;
                    for (ReferenceDescription ref : br.getReferences()) {
                        BrowseNode node = toBrowseNode(ref);
                        nodeList.add(node);
                    }
                }
            }
            return nodeList;
        });

        return future.get();
    }

    private BrowseNode toBrowseNode(ReferenceDescription ref) {
        BrowseNode node = new BrowseNode();
        node.setNativeId(ref.getNodeId().toParseableString());
        node.setAddress(node.getNativeId());
        node.setDisplayName(ref.getDisplayName().getText());
        node.setLeaf(ref.getNodeClass() == NodeClass.Variable || ref.getNodeClass() == NodeClass.VariableType);

        LinkedHashMap<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("nodeClass", ref.getNodeClass().name());
        node.setAttributes(attrs);

        return node;
    }

    private NodeId parseNodeId(String nativeId) {
        if (nativeId.startsWith("ns=")) {
            String[] parts = nativeId.split(";");
            int ns = 0;
            int id = 0;
            for (String part : parts) {
                String trimmed = part.trim();
                if (trimmed.startsWith("ns=")) {
                    ns = Integer.parseInt(trimmed.substring(3));
                } else if (trimmed.startsWith("i=")) {
                    id = Integer.parseInt(trimmed.substring(2));
                }
            }
            return new NodeId(ns, id);
        }
        return Identifiers.ObjectsFolder;
    }

    private String buildEndpointUrl(String connectionId) {
        if (connectionId.startsWith("opc.tcp://")) {
            return connectionId;
        }
        if (connectionId.startsWith("opcua://")) {
            return "opc.tcp://" + connectionId.substring(8);
        }
        return "opc.tcp://" + connectionId;
    }
}
