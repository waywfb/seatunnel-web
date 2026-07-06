package org.apache.seatunnel.plc4x.bridge.service.browse;

import org.apache.seatunnel.plc4x.bridge.exception.BridgeException;
import org.apache.seatunnel.plc4x.bridge.model.BridgeErrorCode;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverRequest;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverResponse;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolCapability;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolType;

import org.springframework.stereotype.Component;

@Component
public class ModbusBrowseProvider implements BrowseProvider {

    @Override
    public ProtocolCapability capability() {
        ProtocolCapability cap = new ProtocolCapability();
        cap.setProtocol(ProtocolType.MODBUS);
        cap.setSupportsBrowse(false);
        cap.setSupportsTree(false);
        cap.setSupportsLazy(false);
        cap.setSupportsMetadata(false);
        cap.setSupportsSubscription(false);
        return cap;
    }

    @Override
    public DiscoverResponse browse(DiscoverRequest request) {
        throw new BridgeException(BridgeErrorCode.BROWSE_NOT_SUPPORTED,
            "Modbus protocol does not support browsing");
    }
}
