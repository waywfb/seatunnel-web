package org.apache.seatunnel.plc4x.bridge.model;

public enum ProtocolType {
    OPCUA("opcua"),
    S7("s7"),
    MODBUS("modbus");

    private final String code;

    ProtocolType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static ProtocolType fromCode(String code) {
        if (code == null) return null;
        String lower = code.toLowerCase();
        for (ProtocolType t : values()) {
            if (t.code.equals(lower) || t.name().equalsIgnoreCase(lower)) {
                return t;
            }
        }
        return null;
    }
}
