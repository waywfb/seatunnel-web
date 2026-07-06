package org.apache.seatunnel.app.service.sync;

import org.apache.seatunnel.app.dal.entity.SyncTaskStatus;

import java.util.Map;

public interface SyncTaskRepository {
    void save(String taskId, SyncTaskStatus status);

    SyncTaskStatus get(String taskId);

    void update(String taskId, int progress, String message, Map<String, Object> result);

    void remove(String taskId);

    boolean exists(String taskId);
}
