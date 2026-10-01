package org.apache.seatunnel.app.domain.request.tag;

import javax.validation.constraints.NotNull;

/**
 * 浏览测点请求。
 *
 * <p>只接受数据源 id，不接受调用方自带的连接串：连接目标必须来自数据源配置，否则任何登录用户都能让服务端连任意 host:port。
 */
public class DiscoverRequestDTO {
    @NotNull private Long datasourceId;
    private String parentNodeId;
    private Integer limit;
    private Integer offset;

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public String getParentNodeId() {
        return parentNodeId;
    }

    public void setParentNodeId(String parentNodeId) {
        this.parentNodeId = parentNodeId;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public Integer getOffset() {
        return offset;
    }

    public void setOffset(Integer offset) {
        this.offset = offset;
    }
}
