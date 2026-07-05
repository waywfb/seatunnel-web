package org.apache.seatunnel.app.ai;

public class ToolCallResult {
    private boolean success;
    private String message;
    private Object data;

    public ToolCallResult(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static ToolCallResult ok(String message, Object data) {
        return new ToolCallResult(true, message, data);
    }

    public static ToolCallResult fail(String message) {
        return new ToolCallResult(false, message, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Object getData() {
        return data;
    }
}
