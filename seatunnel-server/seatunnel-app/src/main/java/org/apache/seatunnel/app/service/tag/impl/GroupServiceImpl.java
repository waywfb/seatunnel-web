package org.apache.seatunnel.app.service.tag.impl;

import org.apache.seatunnel.app.dal.entity.DataSourceTagGroup;
import org.apache.seatunnel.app.dal.mapper.DataSourceTagGroupMapper;
import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;
import org.apache.seatunnel.app.domain.request.group.GroupUpdateDTO;
import org.apache.seatunnel.app.domain.response.group.GroupResponse;
import org.apache.seatunnel.app.service.tag.GroupService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroupServiceImpl implements GroupService {

    private static final String ROOT_PATH = "/root";
    private static final int MAX_DEPTH = 10;

    private final DataSourceTagGroupMapper groupMapper;

    public GroupServiceImpl(DataSourceTagGroupMapper groupMapper) {
        this.groupMapper = groupMapper;
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

        for (DataSourceTagGroup g : entities) {
            groupMapper.insert(g);
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
        return path.split("/").length - 1;
    }

    @Override
    public void updateGroup(Long groupId, GroupUpdateDTO dto) {
        DataSourceTagGroup existing = groupMapper.selectById(groupId);
        if (existing == null || existing.getDeletedAt() != null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "Group not found: " + groupId);
        }
        if (dto.getGroupName() != null) existing.setGroupName(dto.getGroupName());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getSortOrder() != null) existing.setSortOrder(dto.getSortOrder());
        if (dto.getEnabled() != null) existing.setEnabled(dto.getEnabled());
        groupMapper.updateById(existing);
    }

    @Override
    public void deleteGroup(Long groupId) {
        LambdaQueryWrapper<DataSourceTagGroup> childCheck = Wrappers.lambdaQuery();
        childCheck.eq(DataSourceTagGroup::getDeletedAt, (Object) null);
        // Check if path starts with this group's path (has children)
        DataSourceTagGroup group = groupMapper.selectById(groupId);
        if (group != null) {
            LambdaQueryWrapper<DataSourceTagGroup> children = Wrappers.lambdaQuery();
            children.eq(DataSourceTagGroup::getDatasourceId, group.getDatasourceId());
            children.likeRight(DataSourceTagGroup::getPath, group.getPath() + "/");
            children.isNull(DataSourceTagGroup::getDeletedAt);
            if (groupMapper.selectCount(children) > 0) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.ILLEGAL_STATE,
                        "Group has children, cannot delete: " + groupId);
            }
        }
        DataSourceTagGroup update = new DataSourceTagGroup();
        update.setId(groupId);
        update.setDeletedAt(new Date());
        groupMapper.updateById(update);
    }

    @Override
    @Transactional
    public void batchDeleteByDatasourceId(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTagGroup> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTagGroup::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTagGroup::getDeletedAt);
        Date now = new Date();
        List<DataSourceTagGroup> groups = groupMapper.selectList(wrapper);
        for (DataSourceTagGroup g : groups) {
            g.setDeletedAt(now);
            groupMapper.updateById(g);
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
            String p = getParentPath(g.getPath());
            if (parentPath.equals(p)) {
                GroupResponse r = toResponse(g);
                r.setChildren(buildTree(all, g.getPath()));
                result.add(r);
            }
        }
        return result;
    }

    private String getParentPath(String path) {
        int idx = path.lastIndexOf('/');
        if (idx <= 0) return ROOT_PATH;
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
