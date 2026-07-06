package org.apache.seatunnel.app.service.sync.impl;

import org.apache.seatunnel.app.dal.entity.SyncTaskStatus;
import org.apache.seatunnel.app.service.sync.SyncTaskRepository;

import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemorySyncTaskRepository implements SyncTaskRepository {

    private final ConcurrentHashMap<String, SyncTaskStatus> storage = new ConcurrentHashMap<>();

    @Override
    public void save(String taskId, SyncTaskStatus status) {
        storage.put(taskId, status);
    }

    @Override
    public SyncTaskStatus get(String taskId) {
        return storage.get(taskId);
    }

    @Override
    public void update(String taskId, int progress, String message, Map<String, Object> result) {
        SyncTaskStatus status = storage.get(taskId);
        if (status != null) {
            status.setProgress(progress);
            if (message != null) status.setMessage(message);
            if (result != null) status.setResult(result);
        }
    }

    @Override
    public void remove(String taskId) {
        storage.remove(taskId);
    }

    @Override
    public boolean exists(String taskId) {
        return storage.containsKey(taskId);
    }
}
