package org.apache.seatunnel.plc4x.bridge.model;

public enum BridgeErrorCode {
    PLC_CONNECTION_FAILED,
    PLC_TIMEOUT,
    PLC_AUTH_FAILED,
    PLC_PROTOCOL_ERROR,
    BROWSE_NOT_SUPPORTED,
    TAG_NOT_FOUND,
    READ_FAILED,
    WRITE_FAILED
}
