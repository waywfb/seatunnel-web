package org.apache.seatunnel.app.domain.response.tag;

import org.apache.seatunnel.app.service.bridge.collector.PointQuality;

/**
 * 在线读值结果，index 与请求 points 下标一一对应。
 *
 * <p>{@code value} / {@code error} 语义保持不变；新增字段仅描述值的质量与时效，轮询读时 timestamp/cacheAge 为 null，订阅读时才有值。
 */
public class TagValueDTO {
    private int index;
    private String value;
    private String error;
    private PointQuality quality = PointQuality.GOOD;
    private Long sourceTimestamp;
    private Long serverTimestamp;
    private Long cacheAgeMs;

    public TagValueDTO() {}

    public TagValueDTO(int index, String value, String error) {
        this.index = index;
        this.value = value;
        this.error = error;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public PointQuality getQuality() {
        return quality;
    }

    public void setQuality(PointQuality quality) {
        this.quality = quality;
    }

    /** OPC UA SourceTimestamp（设备侧时间），epoch millis。 */
    public Long getSourceTimestamp() {
        return sourceTimestamp;
    }

    public void setSourceTimestamp(Long sourceTimestamp) {
        this.sourceTimestamp = sourceTimestamp;
    }

    /** OPC UA ServerTimestamp（服务器侧时间），epoch millis。 */
    public Long getServerTimestamp() {
        return serverTimestamp;
    }

    public void setServerTimestamp(Long serverTimestamp) {
        this.serverTimestamp = serverTimestamp;
    }

    /** 缓存年龄，epoch millis；直读（轮询）为 null。 */
    public Long getCacheAgeMs() {
        return cacheAgeMs;
    }

    public void setCacheAgeMs(Long cacheAgeMs) {
        this.cacheAgeMs = cacheAgeMs;
    }
}
