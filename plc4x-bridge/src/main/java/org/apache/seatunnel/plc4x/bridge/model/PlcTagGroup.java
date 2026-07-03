package org.apache.seatunnel.plc4x.bridge.model;

import java.util.List;

public class PlcTagGroup {

    private String groupName;
    private List<PlcTagDefinition> tags;

    public PlcTagGroup() {}

    public PlcTagGroup(String groupName, List<PlcTagDefinition> tags) {
        this.groupName = groupName;
        this.tags = tags;
    }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public List<PlcTagDefinition> getTags() { return tags; }
    public void setTags(List<PlcTagDefinition> tags) { this.tags = tags; }
}
