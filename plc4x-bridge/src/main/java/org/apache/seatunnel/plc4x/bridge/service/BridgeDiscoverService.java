package org.apache.seatunnel.plc4x.bridge.service;

import org.apache.seatunnel.plc4x.bridge.exception.BridgeException;
import org.apache.seatunnel.plc4x.bridge.model.BridgeErrorCode;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverRequest;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverResponse;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolType;
import org.apache.seatunnel.plc4x.bridge.service.browse.BrowseProvider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class BridgeDiscoverService {

    private static final Logger log = LoggerFactory.getLogger(BridgeDiscoverService.class);

    private final Map<ProtocolType, BrowseProvider> providerMap = new EnumMap<>(ProtocolType.class);

    public BridgeDiscoverService(List<BrowseProvider> providers) {
        for (BrowseProvider provider : providers) {
            ProtocolType protocol = provider.capability().getProtocol();
            if (protocol != null) {
                providerMap.put(protocol, provider);
            }
        }
        log.info("Registered BrowseProviders: {}", providerMap.keySet());
    }

    public DiscoverResponse discover(DiscoverRequest request) {
        ProtocolType protocol = resolveProtocol(request.getConnectionId());
        BrowseProvider provider = providerMap.get(protocol);

        if (provider == null) {
            throw new BridgeException(BridgeErrorCode.PLC_PROTOCOL_ERROR,
                "No browse provider for protocol: " + protocol);
        }

        if (!provider.capability().isSupportsBrowse()) {
            throw new BridgeException(BridgeErrorCode.BROWSE_NOT_SUPPORTED,
                "Browse not supported for protocol: " + protocol);
        }

        return provider.browse(request);
    }

    public ProtocolType resolveProtocol(String connectionId) {
        if (connectionId == null) {
            throw new BridgeException(BridgeErrorCode.PLC_PROTOCOL_ERROR, "connectionId is null");
        }
        String protocolKey = connectionId.split("://")[0].toLowerCase();
        ProtocolType type = ProtocolType.fromCode(protocolKey);
        if (type == null) {
            throw new BridgeException(BridgeErrorCode.PLC_PROTOCOL_ERROR,
                "Unknown protocol: " + protocolKey);
        }
        return type;
    }
}
