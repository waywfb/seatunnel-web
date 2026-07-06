package org.apache.seatunnel.app.domain.request.tag;

public class RefreshTagsRequest {
    private Long datasourceId;
    private String connectionId;

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public String getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }
}
