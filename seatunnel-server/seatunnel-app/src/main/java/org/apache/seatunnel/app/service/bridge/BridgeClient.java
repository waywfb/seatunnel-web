package org.apache.seatunnel.app.service.bridge;

import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.service.bridge.collector.ReadValuesResponse;

public interface BridgeClient {
    DiscoverResponseDTO discover(DiscoverRequestDTO request);

    /**
     * 读取测点当前值。
     *
     * <p>取值方式由 {@link org.apache.seatunnel.app.service.bridge.collector.PointCollectorRegistry}
     * 按数据源配置路由，调用方不需要感知是轮询还是订阅。
     */
    ReadValuesResponse read(ReadTagsRequest request);
}
