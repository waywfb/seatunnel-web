package org.apache.seatunnel.app.service.bridge.collector;

import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;

import java.util.List;

/**
 * 点位采集器：把"点位值怎么来"从读值接口里剥离出来的扩展点。
 *
 * <p>约定：
 *
 * <ul>
 *   <li>{@link #start}/{@link #stop} 必须幂等，重复调用无副作用；需处理配置变更、数据源删除、应用关闭。
 *   <li>{@link #read} 逐点成败，不因单点失败整体抛异常；返回的 index 与请求 points 下标一一对应。
 *   <li>{@link #read} 必须线程安全。
 *   <li>{@link #status} 返回只读快照，供可观测性与前端展示使用。
 * </ul>
 */
public interface PointCollector {

    /** 该数据源实例是否应由本采集器负责（协议能力 + 数据源实际配置的交集）。 */
    boolean supports(DatasourceContext ctx);

    /** 幂等启动。轮询实现为空实现；订阅实现建立订阅并进入状态机。 */
    default void start(DatasourceContext ctx) {}

    /** 幂等停止并释放资源。 */
    default void stop(Long datasourceId) {}

    /** 运行状态快照；未启动过的数据源返回 STOPPED。 */
    default CollectorStatus status(Long datasourceId) {
        return new CollectorStatus(datasourceId, CollectMode.POLLING);
    }

    /** 读取点位值。逐点成败体现在返回结果的 value/error/quality 上。 */
    List<TagValueDTO> read(DatasourceContext ctx, List<ReadTagsRequest.PointRead> points);
}
