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
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandardField;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFieldReq;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFieldRes;
import org.apache.seatunnel.app.service.IDataStandardFieldService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.commons.collections4.CollectionUtils;

import org.springframework.stereotype.Service;

import javax.annotation.Resource;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Service
public class DataStandardFieldServiceImpl extends SeatunnelBaseServiceImpl
        implements IDataStandardFieldService {

    @Resource(name = "dataStandardFieldDaoImpl")
    private IDataStandardFieldDao dataStandardFieldDao;

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Override
    public List<DataStandardFieldRes> getFieldList(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        List<DataStandardField> fields = dataStandardFieldDao.selectFieldsByVersionId(versionId);

        return fields.stream().map(this::toFieldRes).collect(Collectors.toList());
    }

    @Override
    public List<DataStandardFieldRes> batchUpdateFields(
            Long standardId, Long versionId, List<DataStandardFieldReq> fieldReqs) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        // Delete existing fields
        dataStandardFieldDao.deleteFieldsByVersionId(versionId);

        if (CollectionUtils.isEmpty(fieldReqs)) {
            return new ArrayList<>();
        }

        // Batch insert new fields
        List<DataStandardField> fields =
                fieldReqs.stream()
                        .map(
                                req -> {
                                    Long fieldId = generateId();
                                    Date now = new Date();

                                    return DataStandardField.builder()
                                            .id(fieldId)
                                            .versionId(versionId)
                                            .groupName(req.getGroupName())
                                            .name(req.getName())
                                            .code(req.getCode())
                                            .dataType(req.getDataType())
                                            .length(req.getLength())
                                            .precision(req.getPrecision())
                                            .unit(req.getUnit())
                                            .defaultValue(req.getDefaultValue())
                                            .required(
                                                    req.getRequired() != null
                                                            ? req.getRequired()
                                                            : false)
                                            .description(req.getDescription())
                                            .sortOrder(req.getSortOrder())
                                            .fieldType(req.getFieldType())
                                            .workspaceId(getCurrentWorkspaceId())
                                            .createTime(now)
                                            .updateTime(now)
                                            .build();
                                })
                        .collect(Collectors.toList());

        dataStandardFieldDao.batchInsertFields(fields);

        return fields.stream().map(this::toFieldRes).collect(Collectors.toList());
    }

    private DataStandardFieldRes toFieldRes(DataStandardField field) {
        return DataStandardFieldRes.builder()
                .id(field.getId())
                .versionId(field.getVersionId())
                .groupName(field.getGroupName())
                .name(field.getName())
                .code(field.getCode())
                .dataType(field.getDataType())
                .length(field.getLength())
                .precision(field.getPrecision())
                .unit(field.getUnit())
                .defaultValue(field.getDefaultValue())
                .required(field.getRequired())
                .description(field.getDescription())
                .sortOrder(field.getSortOrder())
                .fieldType(field.getFieldType())
                .createTime(field.getCreateTime())
                .updateTime(field.getUpdateTime())
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
