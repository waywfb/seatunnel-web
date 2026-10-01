package org.apache.seatunnel.app.service.bridge.collector;

import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/** 采集器路由：按 {@link PointCollector#supports} 选出唯一负责该数据源的采集器。 */
@Component
public class PointCollectorRegistry {

    private final List<PointCollector> collectors = new ArrayList<>();

    public PointCollectorRegistry(List<PointCollector> collectorList) {
        if (collectorList != null) {
            this.collectors.addAll(collectorList);
        }
    }

    public PointCollector pick(DatasourceContext ctx) {
        for (PointCollector collector : collectors) {
            if (collector.supports(ctx)) {
                return collector;
            }
        }
        throw new SeatunnelException(
                SeatunnelErrorEnum.ILLEGAL_STATE,
                String.format(
                        "数据源 %s 没有匹配的采集器（协议 %s，采集模式 %s）",
                        ctx.getDatasourceId(), ctx.getBridgeProtocol(), ctx.getCollectMode()));
    }

    public List<PointCollector> getCollectors() {
        return collectors;
    }
}
