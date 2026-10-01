package org.apache.seatunnel.app.service.tag.impl;

import org.apache.seatunnel.app.dal.entity.DataSourceTagGroup;
import org.apache.seatunnel.app.dal.mapper.DataSourceTagGroupMapper;
import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;
import org.apache.seatunnel.app.domain.request.group.GroupUpdateDTO;
import org.apache.seatunnel.app.domain.response.group.GroupResponse;
import org.apache.seatunnel.app.service.tag.ConfigAuditLogService;
import org.apache.seatunnel.app.service.tag.GroupService;
import org.apache.seatunnel.app.utils.ServletUtils;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroupServiceImpl implements GroupService {

    private static final String ROOT_PATH = "/root";
    private static final int MAX_DEPTH = 10;

    private final DataSourceTagGroupMapper groupMapper;
    private final ConfigAuditLogService auditLogService;

    public GroupServiceImpl(
            DataSourceTagGroupMapper groupMapper, ConfigAuditLogService auditLogService) {
        this.groupMapper = groupMapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public List<DataSourceTagGroup> createGroups(Long datasourceId, List<GroupCreateDTO> groups) {
        if (groups == null || groups.isEmpty()) return Collections.emptyList();

        // Ensure root group exists
        ensureRootGroup(datasourceId);

        List<DataSourceTagGroup> entities = new ArrayList<>();
        for (GroupCreateDTO dto : groups) {
            DataSourceTagGroup group = buildGroup(datasourceId, dto, entities);
            entities.add(group);
        }

        String operator = getCurrentOperator();
        for (DataSourceTagGroup g : entities) {
            groupMapper.insert(g);
            auditLogService.record(
                    "GROUP",
                    g.getId(),
                    datasourceId,
                    "INSERT",
                    operator,
                    null,
                    JsonUtils.toJsonString(g),
                    null);
        }
        return entities;
    }

    private void ensureRootGroup(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTagGroup> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTagGroup::getDatasourceId, datasourceId);
        wrapper.eq(DataSourceTagGroup::getPath, ROOT_PATH);
        if (groupMapper.selectCount(wrapper) == 0) {
            DataSourceTagGroup root = new DataSourceTagGroup();
            try {
                root.setId(CodeGenerateUtils.getInstance().genCode());
            } catch (CodeGenerateUtils.CodeGenerateException e) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.ILLEGAL_STATE, "Failed to generate ID");
            }
            root.setDatasourceId(datasourceId);
            root.setLevel(0);
            root.setPath(ROOT_PATH);
            root.setGroupName("root");
            root.setEnabled(true);
            groupMapper.insert(root);
        }
    }

    private DataSourceTagGroup buildGroup(
            Long datasourceId, GroupCreateDTO dto, List<DataSourceTagGroup> existing) {
        DataSourceTagGroup group = new DataSourceTagGroup();
        try {
            group.setId(CodeGenerateUtils.getInstance().genCode());
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.ILLEGAL_STATE, "Failed to generate ID");
        }
        group.setDatasourceId(datasourceId);
        group.setGroupName(dto.getGroupName());
        group.setDescription(dto.getDescription());
        group.setSortOrder(dto.getSortOrder());
        group.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);

        String parentPath = dto.getParentPath() != null ? dto.getParentPath() : ROOT_PATH;
        int parentLevel = getLevelOfPath(parentPath);

        if (parentLevel >= MAX_DEPTH) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.ILLEGAL_STATE, "Group depth exceeds max " + MAX_DEPTH);
        }

        group.setPath(parentPath + "/" + group.getId());
        group.setLevel(parentLevel + 1);
        return group;
    }

    private int getLevelOfPath(String path) {
        if (path == null || path.isEmpty() || ROOT_PATH.equals(path)) return 0;
        // /root/<id> 为 1 级，/root/<id>/<id> 为 2 级
        return path.split("/").length - 2;
    }

    @Override
    public void updateGroup(Long groupId, GroupUpdateDTO dto) {
        DataSourceTagGroup existing = groupMapper.selectById(groupId);
        if (existing == null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "Group not found: " + groupId);
        }
        String beforeSnapshot = JsonUtils.toJsonString(existing);
        if (dto.getGroupName() != null) existing.setGroupName(dto.getGroupName());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getSortOrder() != null) existing.setSortOrder(dto.getSortOrder());
        if (dto.getEnabled() != null) existing.setEnabled(dto.getEnabled());
        groupMapper.updateById(existing);
        auditLogService.record(
                "GROUP",
                groupId,
                existing.getDatasourceId(),
                "UPDATE",
                getCurrentOperator(),
                beforeSnapshot,
                JsonUtils.toJsonString(existing),
                null);
    }

    @Override
    public void deleteGroup(Long groupId) {
        DataSourceTagGroup group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "Group not found: " + groupId);
        }
        LambdaQueryWrapper<DataSourceTagGroup> children = Wrappers.lambdaQuery();
        children.eq(DataSourceTagGroup::getDatasourceId, group.getDatasourceId());
        children.likeRight(DataSourceTagGroup::getPath, group.getPath() + "/");
        children.isNull(DataSourceTagGroup::getDeletedAt);
        if (groupMapper.selectCount(children) > 0) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.ILLEGAL_STATE,
                    "Group has children, cannot delete: " + groupId);
        }
        String beforeSnapshot = JsonUtils.toJsonString(group);
        groupMapper.deleteById(groupId);
        auditLogService.record(
                "GROUP",
                groupId,
                group.getDatasourceId(),
                "DELETE",
                getCurrentOperator(),
                beforeSnapshot,
                null,
                null);
    }

    @Override
    @Transactional
    public void batchDeleteByDatasourceId(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTagGroup> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTagGroup::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTagGroup::getDeletedAt);
        List<DataSourceTagGroup> groups = groupMapper.selectList(wrapper);
        String operator = getCurrentOperator();
        for (DataSourceTagGroup g : groups) {
            String beforeSnapshot = JsonUtils.toJsonString(g);
            groupMapper.deleteById(g.getId());
            auditLogService.record(
                    "GROUP",
                    g.getId(),
                    datasourceId,
                    "DELETE",
                    operator,
                    beforeSnapshot,
                    null,
                    "batch delete by datasource");
        }
    }

    @Override
    public List<GroupResponse> getGroups(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTagGroup> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTagGroup::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTagGroup::getDeletedAt);
        wrapper.orderByAsc(DataSourceTagGroup::getLevel);
        wrapper.orderByAsc(DataSourceTagGroup::getSortOrder);

        List<DataSourceTagGroup> all = groupMapper.selectList(wrapper);
        return buildTree(all, ROOT_PATH);
    }

    private List<GroupResponse> buildTree(List<DataSourceTagGroup> all, String parentPath) {
        List<GroupResponse> result = new ArrayList<>();
        for (DataSourceTagGroup g : all) {
            if (g.getPath().equals(parentPath)) continue;
            String p = getParentPath(g.getPath());
            if (p == null || !parentPath.equals(p)) continue;
            GroupResponse r = toResponse(g);
            r.setChildren(buildTree(all, g.getPath()));
            result.add(r);
        }
        return result;
    }

    private String getParentPath(String path) {
        if (path == null || ROOT_PATH.equals(path)) return null;
        int idx = path.lastIndexOf('/');
        if (idx <= 0) return null;
        return path.substring(0, idx);
    }

    @Override
    public Map<String, Long> buildPathToIdMap(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTagGroup> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTagGroup::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTagGroup::getDeletedAt);
        List<DataSourceTagGroup> groups = groupMapper.selectList(wrapper);
        Map<String, Long> map = new HashMap<>();
        for (DataSourceTagGroup g : groups) {
            map.put(g.getPath(), g.getId());
        }
        return map;
    }

    @Override
    public String getPathById(Long groupId) {
        DataSourceTagGroup group = groupMapper.selectById(groupId);
        return group != null ? group.getPath() : null;
    }

    private static String getCurrentOperator() {
        try {
            return ServletUtils.getCurrentUser().getUsername();
        } catch (Exception e) {
            return "system";
        }
    }

    private GroupResponse toResponse(DataSourceTagGroup g) {
        GroupResponse r = new GroupResponse();
        r.setId(g.getId());
        r.setDatasourceId(g.getDatasourceId());
        r.setLevel(g.getLevel());
        r.setPath(g.getPath());
        r.setGroupName(g.getGroupName());
        r.setDescription(g.getDescription());
        r.setSortOrder(g.getSortOrder());
        r.setEnabled(g.getEnabled());
        r.setCreateTime(g.getCreateTime());
        r.setUpdateTime(g.getUpdateTime());
        return r;
    }
}
