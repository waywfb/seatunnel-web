package org.apache.seatunnel.app.service.bridge.collector;

/**
 * 点位采集器上下文：一次读值/一次采集循环所需的全部输入。
 *
 * <p>刻意不携带 {@code ConnInfo} 等内部实现类型，避免契约与实现耦合。
 */
public class DatasourceContext {

    /** 缓存点超过该年龄即视为 STALE，默认 3s（读值周期为 1s，留 2 次容错）。 */
    public static final long DEFAULT_STALE_THRESHOLD_MS = 3_000;

    private final Long datasourceId;
    private final String pluginName;
    private final String bridgeProtocol;
    private final String connectionId;
    private final String host;
    private final int port;
    private final Long workspaceId;
    private CollectMode collectMode;
    private long staleThresholdMs;

    public DatasourceContext(
            Long datasourceId,
            String pluginName,
            String bridgeProtocol,
            String connectionId,
            String host,
            int port,
            Long workspaceId,
            CollectMode collectMode,
            long staleThresholdMs) {
        this.datasourceId = datasourceId;
        this.pluginName = pluginName;
        this.bridgeProtocol = bridgeProtocol;
        this.connectionId = connectionId;
        this.host = host;
        this.port = port;
        this.workspaceId = workspaceId;
        this.collectMode = collectMode;
        this.staleThresholdMs = staleThresholdMs;
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public String getPluginName() {
        return pluginName;
    }

    public String getBridgeProtocol() {
        return bridgeProtocol;
    }

    public String getConnectionId() {
        return connectionId;
    }

    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public Long getWorkspaceId() {
        return workspaceId;
    }

    public CollectMode getCollectMode() {
        return collectMode;
    }

    public void setCollectMode(CollectMode collectMode) {
        this.collectMode = collectMode;
    }

    /** 缓存新鲜度阈值：超过则该点标记 {@link PointQuality#STALE}。 */
    public long getStaleThresholdMs() {
        return staleThresholdMs;
    }

    /** 非正数视为未配置，回落到 {@link #DEFAULT_STALE_THRESHOLD_MS}，避免"永不过期"。 */
    public void setStaleThresholdMs(long staleThresholdMs) {
        this.staleThresholdMs =
                staleThresholdMs > 0 ? staleThresholdMs : DEFAULT_STALE_THRESHOLD_MS;
    }
}
