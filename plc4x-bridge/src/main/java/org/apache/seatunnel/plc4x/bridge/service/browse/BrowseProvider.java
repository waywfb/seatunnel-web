package org.apache.seatunnel.plc4x.bridge.service.browse;

import org.apache.seatunnel.plc4x.bridge.model.DiscoverRequest;
import org.apache.seatunnel.plc4x.bridge.model.DiscoverResponse;
import org.apache.seatunnel.plc4x.bridge.model.ProtocolCapability;

public interface BrowseProvider {
    ProtocolCapability capability();
    DiscoverResponse browse(DiscoverRequest request);
}
