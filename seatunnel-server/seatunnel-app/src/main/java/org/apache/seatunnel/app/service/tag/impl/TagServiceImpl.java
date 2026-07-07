package org.apache.seatunnel.app.service.tag.impl;

import org.apache.seatunnel.app.dal.entity.DataSourceTag;
import org.apache.seatunnel.app.dal.entity.TagSource;
import org.apache.seatunnel.app.dal.entity.TagStatus;
import org.apache.seatunnel.app.dal.mapper.DataSourceTagMapper;
import org.apache.seatunnel.app.domain.request.tag.TagCreateDTO;
import org.apache.seatunnel.app.domain.request.tag.TagUpdateDTO;
import org.apache.seatunnel.app.domain.response.tag.TagResponse;
import org.apache.seatunnel.app.service.tag.ConfigAuditLogService;
import org.apache.seatunnel.app.service.tag.GroupService;
import org.apache.seatunnel.app.service.tag.TagService;
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
import java.util.stream.Collectors;

@Service
public class TagServiceImpl implements TagService {

    private final DataSourceTagMapper tagMapper;
    private final GroupService groupService;
    private final ConfigAuditLogService auditLogService;

    public TagServiceImpl(
            DataSourceTagMapper tagMapper,
            GroupService groupService,
            ConfigAuditLogService auditLogService) {
        this.tagMapper = tagMapper;
        this.groupService = groupService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public List<DataSourceTag> createTags(
            Long datasourceId, List<TagCreateDTO> tags, Map<String, Long> pathToIdMap) {
        if (tags == null || tags.isEmpty()) return Collections.emptyList();

        // Build map of nativeId -> existing entity (only active, not soft-deleted)
        Map<String, DataSourceTag> existingByNativeId = new HashMap<>();
        for (DataSourceTag t :
                tagMapper.selectList(
                        Wrappers.lambdaQuery(DataSourceTag.class)
                                .eq(DataSourceTag::getDatasourceId, datasourceId)
                                .isNull(DataSourceTag::getDeletedAt))) {
            existingByNativeId.put(t.getNativeId(), t);
        }

        String operator = getCurrentOperator();

        List<DataSourceTag> toInsert = new ArrayList<>();
        List<DataSourceTag> toUpdate = new ArrayList<>();

        for (TagCreateDTO dto : tags) {
            DataSourceTag tag = existingByNativeId.get(dto.getNativeId());
            boolean isNew = (tag == null);

            if (isNew) {
                tag = new DataSourceTag();
                try {
                    tag.setId(CodeGenerateUtils.getInstance().genCode());
                } catch (CodeGenerateUtils.CodeGenerateException e) {
                    throw new SeatunnelException(
                            SeatunnelErrorEnum.ILLEGAL_STATE, "Failed to generate ID");
                }
            }

            tag.setDatasourceId(datasourceId);
            tag.setNativeId(dto.getNativeId());
            tag.setTagAddress(dto.getTagAddress());
            tag.setTagName(dto.getTagName());
            tag.setSource(
                    "browse".equals(dto.getSource())
                            ? TagSource.BROWSE.getCode()
                            : TagSource.IMPORT.getCode());
            tag.setStatus(TagStatus.ACTIVE.getCode());
            tag.setDeletedAt(null);

            if (dto.getGroupPath() != null && pathToIdMap != null) {
                Long groupId = pathToIdMap.get(dto.getGroupPath());
                if (groupId == null) {
                    throw new SeatunnelException(
                            SeatunnelErrorEnum.ILLEGAL_STATE,
                            "Group path not found: " + dto.getGroupPath());
                }
                tag.setGroupId(groupId);
            }

            tag.setAlias(dto.getAlias());
            tag.setDisplayName(dto.getDisplayName());
            tag.setSortOrder(dto.getSortOrder());
            tag.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);
            tag.setSamplingInterval(dto.getSamplingInterval());
            tag.setDeadband(dto.getDeadband());
            tag.setReadOnly(dto.getReadOnly());
            tag.setUnit(dto.getUnit());
            tag.setPrecision(dto.getPrecision());
            if (dto.getProperties() != null) {
                tag.setProperties(JsonUtils.toJsonString(dto.getProperties()));
            }

            if (isNew) {
                toInsert.add(tag);
            } else {
                toUpdate.add(tag);
            }
        }

        for (DataSourceTag tag : toInsert) {
            tagMapper.insert(tag);
            auditLogService.record(
                    "TAG",
                    tag.getId(),
                    datasourceId,
                    "INSERT",
                    operator,
                    null,
                    JsonUtils.toJsonString(tag),
                    null);
        }
        for (DataSourceTag tag : toUpdate) {
            DataSourceTag before = existingByNativeId.get(tag.getNativeId());
            tagMapper.updateById(tag);
            auditLogService.record(
                    "TAG",
                    tag.getId(),
                    datasourceId,
                    "UPDATE",
                    operator,
                    JsonUtils.toJsonString(before),
                    JsonUtils.toJsonString(tag),
                    null);
        }
        return toInsert;
    }

    @Override
    public void updateTag(Long tagId, TagUpdateDTO dto) {
        DataSourceTag existing = tagMapper.selectById(tagId);
        if (existing == null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "Tag not found: " + tagId);
        }

        String beforeSnapshot = JsonUtils.toJsonString(existing);

        if (dto.getTagAddress() != null) existing.setTagAddress(dto.getTagAddress());
        if (dto.getTagName() != null) existing.setTagName(dto.getTagName());
        if (dto.getGroupId() != null) existing.setGroupId(dto.getGroupId());
        if (dto.getAlias() != null) existing.setAlias(dto.getAlias());
        if (dto.getDisplayName() != null) existing.setDisplayName(dto.getDisplayName());
        if (dto.getSortOrder() != null) existing.setSortOrder(dto.getSortOrder());
        if (dto.getEnabled() != null) existing.setEnabled(dto.getEnabled());
        if (dto.getSamplingInterval() != null)
            existing.setSamplingInterval(dto.getSamplingInterval());
        if (dto.getDeadband() != null) existing.setDeadband(dto.getDeadband());
        if (dto.getReadOnly() != null) existing.setReadOnly(dto.getReadOnly());
        if (dto.getUnit() != null) existing.setUnit(dto.getUnit());
        if (dto.getPrecision() != null) existing.setPrecision(dto.getPrecision());
        if (dto.getProperties() != null) {
            existing.setProperties(JsonUtils.toJsonString(dto.getProperties()));
        }

        tagMapper.updateById(existing);
        auditLogService.record(
                "TAG",
                tagId,
                existing.getDatasourceId(),
                "UPDATE",
                getCurrentOperator(),
                beforeSnapshot,
                JsonUtils.toJsonString(existing),
                null);
    }

    @Override
    public void deleteTag(Long tagId) {
        DataSourceTag tag = tagMapper.selectById(tagId);
        if (tag == null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "Tag not found: " + tagId);
        }
        String beforeSnapshot = JsonUtils.toJsonString(tag);
        tagMapper.deleteById(tagId);
        auditLogService.record(
                "TAG",
                tagId,
                tag.getDatasourceId(),
                "DELETE",
                getCurrentOperator(),
                beforeSnapshot,
                null,
                null);
    }

    @Override
    @Transactional
    public void batchDeleteByDatasourceId(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTag> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTag::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTag::getDeletedAt);

        List<DataSourceTag> tags = tagMapper.selectList(wrapper);
        String operator = getCurrentOperator();
        for (DataSourceTag tag : tags) {
            String beforeSnapshot = JsonUtils.toJsonString(tag);
            tagMapper.deleteById(tag.getId());
            auditLogService.record(
                    "TAG",
                    tag.getId(),
                    datasourceId,
                    "DELETE",
                    operator,
                    beforeSnapshot,
                    null,
                    "batch delete by datasource");
        }
    }

    @Override
    public DataSourceTag getTag(Long tagId) {
        return tagMapper.selectById(tagId);
    }

    @Override
    public List<TagResponse> getTags(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTag> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTag::getDatasourceId, datasourceId);
        wrapper.isNull(DataSourceTag::getDeletedAt);
        wrapper.orderByAsc(DataSourceTag::getSortOrder);
        List<DataSourceTag> tags = tagMapper.selectList(wrapper);
        Map<Long, String> groupPathCache = buildGroupPathCache(datasourceId);
        return tags.stream().map(t -> toResponse(t, groupPathCache)).collect(Collectors.toList());
    }

    @Override
    public List<TagResponse> getTagsByGroup(Long datasourceId, Long groupId) {
        LambdaQueryWrapper<DataSourceTag> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTag::getDatasourceId, datasourceId);
        wrapper.eq(DataSourceTag::getGroupId, groupId);
        wrapper.isNull(DataSourceTag::getDeletedAt);
        wrapper.orderByAsc(DataSourceTag::getSortOrder);
        List<DataSourceTag> tags = tagMapper.selectList(wrapper);
        Map<Long, String> groupPathCache = buildGroupPathCache(datasourceId);
        return tags.stream().map(t -> toResponse(t, groupPathCache)).collect(Collectors.toList());
    }

    private Map<Long, String> buildGroupPathCache(Long datasourceId) {
        Map<String, Long> pathToId = groupService.buildPathToIdMap(datasourceId);
        Map<Long, String> idToPath = new HashMap<>();
        for (Map.Entry<String, Long> e : pathToId.entrySet()) {
            idToPath.put(e.getValue(), e.getKey());
        }
        return idToPath;
    }

    @Override
    public List<DataSourceTag> getActiveTags(Long datasourceId) {
        LambdaQueryWrapper<DataSourceTag> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(DataSourceTag::getDatasourceId, datasourceId);
        wrapper.eq(DataSourceTag::getStatus, TagStatus.ACTIVE.getCode());
        wrapper.isNull(DataSourceTag::getDeletedAt);
        return tagMapper.selectList(wrapper);
    }

    @Override
    public void updateStatus(Long tagId, TagStatus status) {
        DataSourceTag tag = new DataSourceTag();
        tag.setId(tagId);
        tag.setStatus(status.getCode());
        tagMapper.updateById(tag);
    }

    private static String getCurrentOperator() {
        try {
            return ServletUtils.getCurrentUser().getUsername();
        } catch (Exception e) {
            return "system";
        }
    }

    private TagResponse toResponse(DataSourceTag tag) {
        return toResponse(tag, Collections.emptyMap());
    }

    private TagResponse toResponse(DataSourceTag tag, Map<Long, String> groupPathCache) {
        TagResponse r = new TagResponse();
        r.setId(tag.getId());
        r.setDatasourceId(tag.getDatasourceId());
        r.setGroupId(tag.getGroupId());
        if (tag.getGroupId() != null) {
            r.setGroupPath(
                    groupPathCache.getOrDefault(
                            tag.getGroupId(), groupService.getPathById(tag.getGroupId())));
        }
        r.setNativeId(tag.getNativeId());
        r.setTagAddress(tag.getTagAddress());
        r.setTagName(tag.getTagName());
        r.setSource(tag.getSource() == TagSource.BROWSE.getCode() ? "browse" : "import");
        r.setStatus(TagStatus.fromCode(tag.getStatus()));
        r.setAlias(tag.getAlias());
        r.setDisplayName(tag.getDisplayName());
        r.setSortOrder(tag.getSortOrder());
        r.setEnabled(tag.getEnabled());
        r.setSamplingInterval(tag.getSamplingInterval());
        r.setDeadband(tag.getDeadband());
        r.setReadOnly(tag.getReadOnly());
        r.setUnit(tag.getUnit());
        r.setPrecision(tag.getPrecision());
        if (tag.getProperties() != null) {
            r.setProperties(JsonUtils.toMap(tag.getProperties(), String.class, Object.class));
        }
        r.setCreateTime(tag.getCreateTime());
        r.setUpdateTime(tag.getUpdateTime());
        return r;
    }
}
