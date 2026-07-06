package org.apache.seatunnel.app.service.sync.impl;

import org.apache.seatunnel.app.service.sync.SyncService;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AsyncSyncTrigger {

    private final SyncService syncService;

    public AsyncSyncTrigger(SyncService syncService) {
        this.syncService = syncService;
    }

    @Async
    public void triggerSync(Long datasourceId) {
        syncService.syncTagsAsync(datasourceId);
    }
}
