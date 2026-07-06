package org.apache.seatunnel.app.service.sync;

import org.apache.seatunnel.app.dal.entity.SyncTaskStatus;

import java.util.concurrent.CompletableFuture;

public interface SyncService {
    CompletableFuture<Void> syncTagsAsync(Long datasourceId);

    SyncTaskStatus getTaskStatus(String taskId);

    void startSync(Long datasourceId);
}
