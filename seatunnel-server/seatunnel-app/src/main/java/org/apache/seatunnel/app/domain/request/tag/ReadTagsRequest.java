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

    /**
     * 单个测点的在线读值参数，字段与点表 properties 对齐。
     *
     * <p>Modbus 使用 unitId/functionCode/offset 组装寄存器地址；S7 与 OPC UA 直接使用 browse 出来的 {@code
     * address}（S7 形如 {@code %DB1:5:INT}，OPC UA 形如 {@code ns=2;s=Foo}），此时 dataType 仅在地址缺少类型后缀时用于补全。
     */
    public static class PointRead {
        private Integer unitId;
        private Integer functionCode;
        private Integer offset;
        private String dataType;
        private String byteOrder;
        private String address;

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

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }
    }
}
