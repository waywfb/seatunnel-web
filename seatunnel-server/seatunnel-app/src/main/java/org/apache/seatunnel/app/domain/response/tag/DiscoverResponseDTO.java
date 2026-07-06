package org.apache.seatunnel.app.domain.response.tag;

import java.util.List;

public class DiscoverResponseDTO {
    private ProtocolCapabilityDTO capability;
    private List<BrowseNodeDTO> nodes;
    private Boolean hasMore;
    private Integer total;

    public ProtocolCapabilityDTO getCapability() {
        return capability;
    }

    public void setCapability(ProtocolCapabilityDTO capability) {
        this.capability = capability;
    }

    public List<BrowseNodeDTO> getNodes() {
        return nodes;
    }

    public void setNodes(List<BrowseNodeDTO> nodes) {
        this.nodes = nodes;
    }

    public Boolean getHasMore() {
        return hasMore;
    }

    public void setHasMore(Boolean hasMore) {
        this.hasMore = hasMore;
    }

    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }
}
