package org.apache.seatunnel.app.domain.response.tag;

/** 在线读值结果，index 与请求 points 下标一一对应。 */
public class TagValueDTO {
    private int index;
    private String value;
    private String error;

    public TagValueDTO() {}

    public TagValueDTO(int index, String value, String error) {
        this.index = index;
        this.value = value;
        this.error = error;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
