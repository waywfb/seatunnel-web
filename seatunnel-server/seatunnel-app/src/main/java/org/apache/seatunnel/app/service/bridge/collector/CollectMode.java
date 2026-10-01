package org.apache.seatunnel.app.service.bridge.collector;

/**
 * 点位采集方式。
 *
 * <p>默认 {@link #POLLING}：保持现有"请求时直连设备读取"的行为不变。{@link #SUBSCRIPTION} 仅在数据源显式开启后生效，且订阅不可用时必须降级回
 * {@link #POLLING}，不允许影响读值可用性。
 */
public enum CollectMode {

    /** 请求时直连设备读取（Modbus / S7 / OPC UA 均适用）。 */
    POLLING,

    /** OPC UA 订阅 + 本地值缓存；不可用时降级为 POLLING。 */
    SUBSCRIPTION;

    /** 默认轮询：订阅必须显式开启，避免未验证的采集路径影响现网读值。 */
    public static CollectMode defaultMode() {
        return POLLING;
    }
}
