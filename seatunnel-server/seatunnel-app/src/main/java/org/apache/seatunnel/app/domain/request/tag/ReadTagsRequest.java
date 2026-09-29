package org.apache.seatunnel.app.domain.request.tag;

import java.util.List;

public class ReadTagsRequest {

    private Long datasourceId;
    private List<PointRead> points;

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public List<PointRead> getPoints() {
        return points;
    }

    public void setPoints(List<PointRead> points) {
        this.points = points;
    }

    /** 单个测点的在线读值参数，字段与点表 properties 对齐。 */
    public static class PointRead {
        private Integer unitId;
        private Integer functionCode;
        private Integer offset;
        private String dataType;
        private String byteOrder;

        public Integer getUnitId() {
            return unitId;
        }

        public void setUnitId(Integer unitId) {
            this.unitId = unitId;
        }

        public Integer getFunctionCode() {
            return functionCode;
        }

        public void setFunctionCode(Integer functionCode) {
            this.functionCode = functionCode;
        }

        public Integer getOffset() {
            return offset;
        }

        public void setOffset(Integer offset) {
            this.offset = offset;
        }

        public String getDataType() {
            return dataType;
        }

        public void setDataType(String dataType) {
            this.dataType = dataType;
        }

        public String getByteOrder() {
            return byteOrder;
        }

        public void setByteOrder(String byteOrder) {
            this.byteOrder = byteOrder;
        }
    }
}
