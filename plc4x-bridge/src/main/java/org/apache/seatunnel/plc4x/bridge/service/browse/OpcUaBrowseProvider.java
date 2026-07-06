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
import org.eclipse.milo.opcua.stack.core.UaException;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.enumerated.NodeClass;
import org.eclipse.milo.opcua.stack.core.types.structured.ReferenceDescription;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

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
        OpcUaClient client = null;

        try {
            client = OpcUaClient.create(endpointUrl);
            client.connect().get();

            NodeId browseRoot;
            if (request.getParentNodeId() != null && !request.getParentNodeId().isEmpty()) {
                browseRoot = parseNodeId(request.getParentNodeId());
            } else {
                browseRoot = Identifiers.ObjectsFolder;
            }

            List<BrowseNode> nodes = browseChildren(client, browseRoot);

            DiscoverResponse response = new DiscoverResponse();
            response.setCapability(capability());
            response.setNodes(nodes);
            response.setHasMore(false);
            response.setTotal(nodes.size());
            return response;
        } catch (Exception e) {
            throw new BridgeException(BridgeErrorCode.PLC_CONNECTION_FAILED,
                "OPC UA browse failed: " + e.getMessage());
        } finally {
            if (client != null) {
                try {
                    client.disconnect().get();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private List<BrowseNode> browseChildren(OpcUaClient client, NodeId parent) throws UaException {
        List<? extends ReferenceDescription> refs = client.getAddressSpace().browse(parent);

        List<BrowseNode> nodeList = new ArrayList<>();
        for (ReferenceDescription ref : refs) {
            if (ref == null || ref.getNodeId() == null) continue;
            nodeList.add(toBrowseNode(ref));
        }
        return nodeList;
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
        if (nativeId == null || !nativeId.startsWith("ns=")) {
            return Identifiers.ObjectsFolder;
        }
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
