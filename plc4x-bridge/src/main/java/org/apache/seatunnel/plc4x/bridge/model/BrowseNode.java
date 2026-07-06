package org.apache.seatunnel.plc4x.bridge.model;

import java.util.List;
import java.util.Map;

public class BrowseNode {
    private String nativeId;
    private String address;
    private String displayName;
    private Boolean leaf;
    private List<BrowseNode> children;
    private Map<String, Object> attributes;

    public String getNativeId() { return nativeId; }
    public void setNativeId(String nativeId) { this.nativeId = nativeId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public Boolean getLeaf() { return leaf; }
    public void setLeaf(Boolean leaf) { this.leaf = leaf; }
    public List<BrowseNode> getChildren() { return children; }
    public void setChildren(List<BrowseNode> children) { this.children = children; }
    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
}
