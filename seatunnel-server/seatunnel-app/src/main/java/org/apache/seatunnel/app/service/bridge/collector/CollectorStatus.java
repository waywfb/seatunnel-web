package org.apache.seatunnel.app.service.bridge.collector;

/** 采集器对外暴露的运行状态（只读快照，不回写数据源配置）。 */
public class CollectorStatus {

    private final Long datasourceId;
    private final CollectMode collectMode;
    private CollectorState state = CollectorState.STOPPED;
    private String degradedReason;
    private Long lastPublishTime;
    private int monitoredItemCount;
    private int consecutiveFailures;

    public CollectorStatus(Long datasourceId, CollectMode collectMode) {
        this.datasourceId = datasourceId;
        this.collectMode = collectMode;
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public CollectMode getCollectMode() {
        return collectMode;
    }

    public CollectorState getState() {
        return state;
    }

    public void setState(CollectorState state) {
        this.state = state;
    }

    /** 只有 DEGRADED 算降级；STOPPED 表示未采集（轮询即常态），不算故障。 */
    public boolean isDegraded() {
        return state == CollectorState.DEGRADED;
    }

    public String getDegradedReason() {
        return degradedReason;
    }

    public void setDegradedReason(String degradedReason) {
        this.degradedReason = degradedReason;
    }

    public Long getLastPublishTime() {
        return lastPublishTime;
    }

    public void setLastPublishTime(Long lastPublishTime) {
        this.lastPublishTime = lastPublishTime;
    }

    public int getMonitoredItemCount() {
        return monitoredItemCount;
    }

    public void setMonitoredItemCount(int monitoredItemCount) {
        this.monitoredItemCount = monitoredItemCount;
    }

    public int getConsecutiveFailures() {
        return consecutiveFailures;
    }

    public void setConsecutiveFailures(int consecutiveFailures) {
        this.consecutiveFailures = consecutiveFailures;
    }
}
