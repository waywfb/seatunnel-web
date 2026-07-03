package org.apache.seatunnel.plc4x.bridge.model;

import java.util.List;

public class PlcPreviewRequest {

    private String connectionId;
    private List<String> tagAddresses;

    public PlcPreviewRequest() {}

    public PlcPreviewRequest(String connectionId, List<String> tagAddresses) {
        this.connectionId = connectionId;
        this.tagAddresses = tagAddresses;
    }

    public String getConnectionId() { return connectionId; }
    public void setConnectionId(String connectionId) { this.connectionId = connectionId; }
    public List<String> getTagAddresses() { return tagAddresses; }
    public void setTagAddresses(List<String> tagAddresses) { this.tagAddresses = tagAddresses; }
}
