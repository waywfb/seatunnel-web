package org.apache.seatunnel.plc4x.bridge.model;

import java.util.Map;

public class PlcConnectionRequest {

    private String protocol;
    private String host;
    private int port;
    private Map<String, String> params;

    public PlcConnectionRequest() {}

    public PlcConnectionRequest(String protocol, String host, int port) {
        this.protocol = protocol;
        this.host = host;
        this.port = port;
    }

    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    public Map<String, String> getParams() { return params; }
    public void setParams(Map<String, String> params) { this.params = params; }

    public String toConnectionId() {
        return protocol + "://" + host + ":" + port;
    }
}
