package org.apache.seatunnel.app.dal.entity;

import java.util.Date;
import java.util.Map;

public class SyncTaskStatus {
    public enum State {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED
    }

    private String taskId;
    private State state;
    private int progress;
    private String message;
    private Map<String, Object> result;
    private Date createdAt;
    private Date updatedAt;

    public static SyncTaskStatus pending(String taskId) {
        SyncTaskStatus s = new SyncTaskStatus();
        s.taskId = taskId;
        s.state = State.PENDING;
        s.progress = 0;
        s.createdAt = new Date();
        s.updatedAt = new Date();
        return s;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getResult() {
        return result;
    }

    public void setResult(Map<String, Object> result) {
        this.result = result;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
