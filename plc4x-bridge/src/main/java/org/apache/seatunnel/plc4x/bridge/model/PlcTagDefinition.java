package org.apache.seatunnel.plc4x.bridge.model;

public class PlcTagDefinition {

    private String tagAddress;
    private String tagName;
    private String dataType;

    public PlcTagDefinition() {}

    public PlcTagDefinition(String tagAddress, String tagName, String dataType) {
        this.tagAddress = tagAddress;
        this.tagName = tagName;
        this.dataType = dataType;
    }

    public String getTagAddress() { return tagAddress; }
    public void setTagAddress(String tagAddress) { this.tagAddress = tagAddress; }
    public String getTagName() { return tagName; }
    public void setTagName(String tagName) { this.tagName = tagName; }
    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }
}
