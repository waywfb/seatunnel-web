package org.apache.seatunnel.app.dal.entity;

public enum TagStatus {
    ACTIVE(1),
    ORPHANED(2),
    DELETED(3);

    private final int code;

    TagStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static TagStatus fromCode(int code) {
        for (TagStatus s : values()) {
            if (s.code == code) return s;
        }
        return ACTIVE;
    }
}
