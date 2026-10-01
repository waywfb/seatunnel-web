package org.apache.seatunnel.app.service.bridge.collector;

/**
 * 采集器运行状态。
 *
 * <p>读值路由只信任 {@link #SUBSCRIBED}：其余状态一律走轮询，不返回缓存旧值。
 */
public enum CollectorState {

    /** 未启动（数据源未启用该采集方式，或已被停止）。 */
    STOPPED,

    /** 启动中：正在建立连接 / 订阅。 */
    STARTING,

    /** 采集中：订阅已建立，缓存持续更新。 */
    SUBSCRIBED,

    /** 已降级：订阅不可用，读值路由到轮询。 */
    DEGRADED,

    /** 恢复中：降级后正在重试建立订阅。 */
    RECOVERING
}
