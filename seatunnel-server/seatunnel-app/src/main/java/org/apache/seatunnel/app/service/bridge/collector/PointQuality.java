package org.apache.seatunnel.app.service.bridge.collector;

/** 单点值质量。 */
public enum PointQuality {

    /** 值有效。 */
    GOOD,

    /** 值无效（设备返回 Bad StatusCode、地址非法等），value 为 null。 */
    BAD,

    /** 值不可信（数据超出量程、StatusCode 为 Uncertain）。 */
    UNCERTAIN,

    /** 值来自缓存且已超过新鲜度阈值，value 可用但不可信其时效。 */
    STALE
}
