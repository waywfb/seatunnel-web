package org.apache.seatunnel.app.dal.entity;

public enum TagSource {
    BROWSE(1),
    IMPORT(2);

    private final int code;

    TagSource(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static TagSource fromCode(int code) {
        for (TagSource s : values()) {
            if (s.code == code) return s;
        }
        return IMPORT;
    }
}
