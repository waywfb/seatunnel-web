package org.apache.seatunnel.app.service.bridge;

import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;

import java.util.List;

public interface BridgeClient {
    DiscoverResponseDTO discover(DiscoverRequestDTO request);

    /** 在线试读测点当前值（Modbus probe）。 */
    List<TagValueDTO> read(ReadTagsRequest request);
}
