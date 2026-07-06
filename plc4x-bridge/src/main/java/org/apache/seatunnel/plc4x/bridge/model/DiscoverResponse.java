package org.apache.seatunnel.plc4x.bridge.model;

import java.util.List;

public class DiscoverResponse {
    private ProtocolCapability capability;
    private List<BrowseNode> nodes;
    private Boolean hasMore;
    private Integer total;

    public ProtocolCapability getCapability() { return capability; }
    public void setCapability(ProtocolCapability capability) { this.capability = capability; }
    public List<BrowseNode> getNodes() { return nodes; }
    public void setNodes(List<BrowseNode> nodes) { this.nodes = nodes; }
    public Boolean getHasMore() { return hasMore; }
    public void setHasMore(Boolean hasMore) { this.hasMore = hasMore; }
    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
}
