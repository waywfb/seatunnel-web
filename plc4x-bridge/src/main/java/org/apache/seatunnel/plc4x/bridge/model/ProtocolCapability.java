package org.apache.seatunnel.plc4x.bridge.model;

public class ProtocolCapability {
    private ProtocolType protocol;
    private boolean supportsBrowse;
    private boolean supportsTree;
    private boolean supportsLazy;
    private boolean supportsMetadata;
    private boolean supportsSubscription;

    public ProtocolCapability() {}

    public ProtocolCapability(ProtocolType protocol, boolean supportsBrowse,
                              boolean supportsTree, boolean supportsLazy,
                              boolean supportsMetadata, boolean supportsSubscription) {
        this.protocol = protocol;
        this.supportsBrowse = supportsBrowse;
        this.supportsTree = supportsTree;
        this.supportsLazy = supportsLazy;
        this.supportsMetadata = supportsMetadata;
        this.supportsSubscription = supportsSubscription;
    }

    public ProtocolType getProtocol() { return protocol; }
    public void setProtocol(ProtocolType protocol) { this.protocol = protocol; }
    public boolean isSupportsBrowse() { return supportsBrowse; }
    public void setSupportsBrowse(boolean supportsBrowse) { this.supportsBrowse = supportsBrowse; }
    public boolean isSupportsTree() { return supportsTree; }
    public void setSupportsTree(boolean supportsTree) { this.supportsTree = supportsTree; }
    public boolean isSupportsLazy() { return supportsLazy; }
    public void setSupportsLazy(boolean supportsLazy) { this.supportsLazy = supportsLazy; }
    public boolean isSupportsMetadata() { return supportsMetadata; }
    public void setSupportsMetadata(boolean supportsMetadata) { this.supportsMetadata = supportsMetadata; }
    public boolean isSupportsSubscription() { return supportsSubscription; }
    public void setSupportsSubscription(boolean supportsSubscription) { this.supportsSubscription = supportsSubscription; }
}
