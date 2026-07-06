package org.apache.seatunnel.app.domain.response.tag;

public class ProtocolCapabilityDTO {
    private String protocol;
    private boolean supportsBrowse;
    private boolean supportsTree;
    private boolean supportsLazy;
    private boolean supportsMetadata;
    private boolean supportsSubscription;

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public boolean isSupportsBrowse() {
        return supportsBrowse;
    }

    public void setSupportsBrowse(boolean supportsBrowse) {
        this.supportsBrowse = supportsBrowse;
    }

    public boolean isSupportsTree() {
        return supportsTree;
    }

    public void setSupportsTree(boolean supportsTree) {
        this.supportsTree = supportsTree;
    }

    public boolean isSupportsLazy() {
        return supportsLazy;
    }

    public void setSupportsLazy(boolean supportsLazy) {
        this.supportsLazy = supportsLazy;
    }

    public boolean isSupportsMetadata() {
        return supportsMetadata;
    }

    public void setSupportsMetadata(boolean supportsMetadata) {
        this.supportsMetadata = supportsMetadata;
    }

    public boolean isSupportsSubscription() {
        return supportsSubscription;
    }

    public void setSupportsSubscription(boolean supportsSubscription) {
        this.supportsSubscription = supportsSubscription;
    }
}
