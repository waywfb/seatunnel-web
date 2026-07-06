package org.apache.seatunnel.app.domain.response.tag;

import java.util.List;
import java.util.Map;

public class BrowseNodeDTO {
    private String nativeId;
    private String address;
    private String displayName;
    private Boolean leaf;
    private List<BrowseNodeDTO> children;
    private Map<String, Object> attributes;

    public String getNativeId() {
        return nativeId;
    }

    public void setNativeId(String nativeId) {
        this.nativeId = nativeId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Boolean getLeaf() {
        return leaf;
    }

    public void setLeaf(Boolean leaf) {
        this.leaf = leaf;
    }

    public List<BrowseNodeDTO> getChildren() {
        return children;
    }

    public void setChildren(List<BrowseNodeDTO> children) {
        this.children = children;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
}
