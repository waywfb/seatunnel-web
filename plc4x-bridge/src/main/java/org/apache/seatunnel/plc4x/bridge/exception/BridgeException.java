package org.apache.seatunnel.plc4x.bridge.exception;

import org.apache.seatunnel.plc4x.bridge.model.BridgeErrorCode;

public class BridgeException extends RuntimeException {
    private final BridgeErrorCode errorCode;

    public BridgeException(BridgeErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BridgeErrorCode getErrorCode() { return errorCode; }
}
