package org.apache.seatunnel.plc4x.bridge.model;

import java.util.List;
import java.util.Map;

public class SubscribeRequest {

    private String connectionId;
    private List<PlcTagDefinition> tags;
    private String sinkType;
    private Map<String, String> sinkConfig;
    private int batchSize = 100;
    private long batchIntervalMs = 200;

    public SubscribeRequest() {}

    public String getConnectionId() { return connectionId; }
    public void setConnectionId(String connectionId) { this.connectionId = connectionId; }
    public List<PlcTagDefinition> getTags() { return tags; }
    public void setTags(List<PlcTagDefinition> tags) { this.tags = tags; }
    public String getSinkType() { return sinkType; }
    public void setSinkType(String sinkType) { this.sinkType = sinkType; }
    public Map<String, String> getSinkConfig() { return sinkConfig; }
    public void setSinkConfig(Map<String, String> sinkConfig) { this.sinkConfig = sinkConfig; }
    public int getBatchSize() { return batchSize; }
    public void setBatchSize(int batchSize) { this.batchSize = batchSize; }
    public long getBatchIntervalMs() { return batchIntervalMs; }
    public void setBatchIntervalMs(long batchIntervalMs) { this.batchIntervalMs = batchIntervalMs; }
}
