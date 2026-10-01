package org.apache.seatunnel.app.service.bridge.collector;

import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;

import java.util.ArrayList;
import java.util.List;

/**
 * 读值响应。
 *
 * <p>{@link #values} 保持与旧接口完全一致的数组语义（index 与请求 points 下标对应），新增的元数据只用于说明"值从哪来、有多新、是否降级"。
 */
public class ReadValuesResponse {

    private final List<TagValueDTO> values;
    private CollectMode collectMode;
    private CollectorState collectorState;
    private boolean degraded;
    private String degradedReason;
    private Long maxCacheAgeMs;

    public ReadValuesResponse(List<TagValueDTO> values) {
        this.values = values == null ? new ArrayList<>() : values;
    }

    public List<TagValueDTO> getValues() {
        return values;
    }

    public CollectMode getCollectMode() {
        return collectMode;
    }

    public void setCollectMode(CollectMode collectMode) {
        this.collectMode = collectMode;
    }

    public CollectorState getCollectorState() {
        return collectorState;
    }

    public void setCollectorState(CollectorState collectorState) {
        this.collectorState = collectorState;
    }

    public boolean isDegraded() {
        return degraded;
    }

    public void setDegraded(boolean degraded) {
        this.degraded = degraded;
    }

    public String getDegradedReason() {
        return degradedReason;
    }

    public void setDegradedReason(String degradedReason) {
        this.degradedReason = degradedReason;
    }

    /** 本次响应中最陈旧点的缓存年龄（毫秒）；非缓存读为 null。 */
    public Long getMaxCacheAgeMs() {
        return maxCacheAgeMs;
    }

    public void setMaxCacheAgeMs(Long maxCacheAgeMs) {
        this.maxCacheAgeMs = maxCacheAgeMs;
    }
}
