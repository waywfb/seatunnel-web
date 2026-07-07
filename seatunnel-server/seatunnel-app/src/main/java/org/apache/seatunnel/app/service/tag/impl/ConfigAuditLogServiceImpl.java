package org.apache.seatunnel.app.service.tag.impl;

import org.apache.seatunnel.app.dal.entity.ConfigAuditLog;
import org.apache.seatunnel.app.dal.mapper.ConfigAuditLogMapper;
import org.apache.seatunnel.app.service.tag.ConfigAuditLogService;

import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class ConfigAuditLogServiceImpl implements ConfigAuditLogService {

    private final ConfigAuditLogMapper auditLogMapper;

    public ConfigAuditLogServiceImpl(ConfigAuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    public void record(
            String bizType,
            Long bizId,
            Long datasourceId,
            String actionType,
            String operator,
            String beforeSnapshot,
            String afterSnapshot,
            String remark) {
        ConfigAuditLog log = new ConfigAuditLog();
        log.setBizType(bizType);
        log.setBizId(bizId);
        log.setDatasourceId(datasourceId);
        log.setActionType(actionType);
        log.setOperator(operator);
        log.setBeforeSnapshot(beforeSnapshot);
        log.setAfterSnapshot(afterSnapshot);
        log.setRemark(remark);
        log.setCreateTime(new Date());
        auditLogMapper.insert(log);
    }
}
