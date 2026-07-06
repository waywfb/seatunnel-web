package org.apache.seatunnel.app.service.bridge;

import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;

public interface BridgeClient {
    DiscoverResponseDTO discover(DiscoverRequestDTO request);
}
