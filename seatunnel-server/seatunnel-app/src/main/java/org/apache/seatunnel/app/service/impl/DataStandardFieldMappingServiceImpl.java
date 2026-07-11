/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.app.service.impl;

import org.apache.seatunnel.app.dal.dao.IDataStandardFieldDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardFieldMappingDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandardField;
import org.apache.seatunnel.app.dal.entity.DataStandardFieldMapping;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFieldMappingReq;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFieldMappingRes;
import org.apache.seatunnel.app.service.IDataStandardFieldMappingService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.commons.collections4.CollectionUtils;

import org.springframework.stereotype.Service;

import javax.annotation.Resource;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Service
public class DataStandardFieldMappingServiceImpl extends SeatunnelBaseServiceImpl
        implements IDataStandardFieldMappingService {

    @Resource(name = "dataStandardFieldMappingDaoImpl")
    private IDataStandardFieldMappingDao dataStandardFieldMappingDao;

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Resource(name = "dataStandardFieldDaoImpl")
    private IDataStandardFieldDao dataStandardFieldDao;

    @Override
    public List<DataStandardFieldMappingRes> getMappingList(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        List<DataStandardFieldMapping> mappings =
                dataStandardFieldMappingDao.selectMappingsByVersionId(versionId);

        Map<Long, String> fieldNameMap = resolveFieldNames(mappings);

        return mappings.stream()
                .map(m -> toMappingRes(m, fieldNameMap))
                .collect(Collectors.toList());
    }

    @Override
    public List<DataStandardFieldMappingRes> batchUpdateMappings(
            Long standardId, Long versionId, List<DataStandardFieldMappingReq> mappingReqs) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        // Delete existing mappings
        dataStandardFieldMappingDao.deleteMappingsByVersionId(versionId);

        if (CollectionUtils.isEmpty(mappingReqs)) {
            return new ArrayList<>();
        }

        List<DataStandardFieldMapping> mappings =
                mappingReqs.stream()
                        .map(
                                req -> {
                                    Long mappingId = generateId();
                                    Date now = new Date();

                                    return DataStandardFieldMapping.builder()
                                            .id(mappingId)
                                            .versionId(versionId)
                                            .fieldId(req.getFieldId())
                                            .sourceName(req.getSourceName())
                                            .sourceIndex(req.getSourceIndex())
                                            .mappingType(req.getMappingType())
                                            .sampleValue(req.getSampleValue())
                                            .workspaceId(getCurrentWorkspaceId())
                                            .createTime(now)
                                            .build();
                                })
                        .collect(Collectors.toList());

        dataStandardFieldMappingDao.batchInsertMappings(mappings);

        Map<Long, String> fieldNameMap = resolveFieldNames(mappings);

        return mappings.stream()
                .map(m -> toMappingRes(m, fieldNameMap))
                .collect(Collectors.toList());
    }

    private Map<Long, String> resolveFieldNames(List<DataStandardFieldMapping> mappings) {
        if (CollectionUtils.isEmpty(mappings)) {
            return Collections.emptyMap();
        }
        List<Long> fieldIds =
                mappings.stream()
                        .map(DataStandardFieldMapping::getFieldId)
                        .distinct()
                        .collect(Collectors.toList());
        if (fieldIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<DataStandardField> fields = dataStandardFieldDao.selectFieldsByIds(fieldIds);
        return fields.stream()
                .collect(Collectors.toMap(DataStandardField::getId, DataStandardField::getName));
    }

    private DataStandardFieldMappingRes toMappingRes(
            DataStandardFieldMapping mapping, Map<Long, String> fieldNameMap) {
        return DataStandardFieldMappingRes.builder()
                .id(mapping.getId())
                .versionId(mapping.getVersionId())
                .fieldId(mapping.getFieldId())
                .fieldName(fieldNameMap.get(mapping.getFieldId()))
                .sourceName(mapping.getSourceName())
                .sourceIndex(mapping.getSourceIndex())
                .mappingType(mapping.getMappingType())
                .sampleValue(mapping.getSampleValue())
                .createTime(mapping.getCreateTime())
                .build();
    }

    private Long generateId() {
        try {
            return CodeGenerateUtils.getInstance().genCode();
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.JSON_TRANSFORM_FAILED);
        }
    }
}
