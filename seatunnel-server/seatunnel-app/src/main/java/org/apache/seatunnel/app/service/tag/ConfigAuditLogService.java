package org.apache.seatunnel.app.service.tag;

public interface ConfigAuditLogService {

    void record(
            String bizType,
            Long bizId,
            Long datasourceId,
            String actionType,
            String operator,
            String beforeSnapshot,
            String afterSnapshot,
            String remark);
}
