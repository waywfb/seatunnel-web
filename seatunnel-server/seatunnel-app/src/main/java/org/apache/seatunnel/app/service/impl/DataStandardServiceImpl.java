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

import org.apache.seatunnel.app.dal.dao.IDataStandardDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardFieldDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandard;
import org.apache.seatunnel.app.dal.entity.DataStandardField;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardReq;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardVersionReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardDetailRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardVersionRes;
import org.apache.seatunnel.app.service.IDataStandardService;
import org.apache.seatunnel.app.service.IDataStandardVersionService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.commons.collections4.CollectionUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import javax.annotation.Resource;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentUserId;
import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Service
public class DataStandardServiceImpl extends SeatunnelBaseServiceImpl
        implements IDataStandardService {

    @Resource(name = "dataStandardDaoImpl")
    private IDataStandardDao dataStandardDao;

    @Resource(name = "dataStandardFieldDaoImpl")
    private IDataStandardFieldDao dataStandardFieldDao;

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Autowired private IDataStandardVersionService dataStandardVersionService;

    @Override
    public Long createDataStandard(DataStandardReq req) {
        // Check code unique
        if (!dataStandardDao.checkDataStandardCodeUnique(req.getCode(), null)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_CODE_ALREADY_EXISTS);
        }

        Long standardId = generateId();
        Date now = new Date();

        DataStandard dataStandard =
                DataStandard.builder()
                        .id(standardId)
                        .name(req.getName())
                        .code(req.getCode())
                        .industry(req.getIndustry())
                        .type(req.getType() != null ? req.getType() : "CUSTOM")
                        .source(req.getSource())
                        .status(1)
                        .description(req.getDescription())
                        .workspaceId(getCurrentWorkspaceId())
                        .createUserId(getCurrentUserId())
                        .updateUserId(getCurrentUserId())
                        .createTime(now)
                        .updateTime(now)
                        .build();

        dataStandardDao.insertDataStandard(dataStandard);

        // Create initial version V1.0
        DataStandardVersionReq versionReq =
                DataStandardVersionReq.builder().version("V1.0").description("初始版本").build();
        dataStandardVersionService.createVersion(standardId, versionReq);

        return standardId;
    }

    @Override
    public boolean updateDataStandard(Long id, DataStandardReq req) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        // Check code unique (exclude current)
        if (!dataStandardDao.checkDataStandardCodeUnique(req.getCode(), id)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_CODE_ALREADY_EXISTS);
        }

        dataStandard.setName(req.getName());
        dataStandard.setCode(req.getCode());
        dataStandard.setIndustry(req.getIndustry());
        dataStandard.setType(req.getType());
        dataStandard.setSource(req.getSource());
        dataStandard.setDescription(req.getDescription());
        dataStandard.setUpdateUserId(getCurrentUserId());
        dataStandard.setUpdateTime(new Date());

        return dataStandardDao.updateDataStandard(dataStandard);
    }

    @Override
    public boolean deleteDataStandard(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        // Check if has virtual table reference
        if (dataStandardDao.checkHasVirtualTableReference(id)) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.DATA_STANDARD_HAS_VIRTUAL_TABLE_REFERENCE);
        }

        // Delete versions
        List<DataStandardVersion> versions = dataStandardVersionDao.selectVersionsByStandardId(id);
        for (DataStandardVersion version : versions) {
            dataStandardVersionService.deleteVersion(id, version.getId());
        }

        return dataStandardDao.deleteDataStandard(id);
    }

    @Override
    public DataStandardDetailRes getDataStandardDetail(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        List<DataStandardVersion> versions = dataStandardVersionDao.selectVersionsByStandardId(id);
        List<DataStandardVersionRes> versionResList =
                versions.stream()
                        .map(
                                v ->
                                        DataStandardVersionRes.builder()
                                                .id(v.getId())
                                                .standardId(v.getStandardId())
                                                .version(v.getVersion())
                                                .status(v.getStatus())
                                                .isCurrent(v.getIsCurrent())
                                                .description(v.getDescription())
                                                .createUserId(v.getCreateUserId())
                                                .createTime(v.getCreateTime())
                                                .build())
                        .collect(Collectors.toList());

        return DataStandardDetailRes.builder()
                .id(dataStandard.getId())
                .name(dataStandard.getName())
                .code(dataStandard.getCode())
                .industry(dataStandard.getIndustry())
                .type(dataStandard.getType())
                .source(dataStandard.getSource())
                .status(dataStandard.getStatus())
                .description(dataStandard.getDescription())
                .currentVersionId(dataStandard.getCurrentVersionId())
                .createUserId(dataStandard.getCreateUserId())
                .updateUserId(dataStandard.getUpdateUserId())
                .createTime(dataStandard.getCreateTime())
                .updateTime(dataStandard.getUpdateTime())
                .versions(versionResList)
                .build();
    }

    @Override
    public PageInfo<DataStandardRes> getDataStandardPage(
            String name, String type, Integer status, Integer pageNo, Integer pageSize) {
        Page<DataStandard> page = new Page<>(pageNo, pageSize);
        IPage<DataStandard> dataStandardPage =
                dataStandardDao.selectDataStandardPage(page, name, type, status);

        PageInfo<DataStandardRes> pageInfo = new PageInfo<>(pageNo, pageSize);
        pageInfo.setTotalCount((int) dataStandardPage.getTotal());

        if (CollectionUtils.isEmpty(dataStandardPage.getRecords())) {
            pageInfo.setData(new ArrayList<>());
        } else {
            List<DataStandardRes> resList =
                    dataStandardPage.getRecords().stream()
                            .map(
                                    ds ->
                                            DataStandardRes.builder()
                                                    .id(ds.getId())
                                                    .name(ds.getName())
                                                    .code(ds.getCode())
                                                    .industry(ds.getIndustry())
                                                    .type(ds.getType())
                                                    .status(ds.getStatus())
                                                    .description(ds.getDescription())
                                                    .createUserId(ds.getCreateUserId())
                                                    .updateUserId(ds.getUpdateUserId())
                                                    .createTime(ds.getCreateTime())
                                                    .updateTime(ds.getUpdateTime())
                                                    .build())
                            .collect(Collectors.toList());
            pageInfo.setData(resList);
        }

        return pageInfo;
    }

    @Override
    public boolean enableDataStandard(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        dataStandard.setStatus(1);
        dataStandard.setUpdateUserId(getCurrentUserId());
        dataStandard.setUpdateTime(new Date());
        return dataStandardDao.updateDataStandard(dataStandard);
    }

    @Override
    public boolean disableDataStandard(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        dataStandard.setStatus(0);
        dataStandard.setUpdateUserId(getCurrentUserId());
        dataStandard.setUpdateTime(new Date());
        return dataStandardDao.updateDataStandard(dataStandard);
    }

    @Override
    public Long copyDataStandard(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        // Generate new code
        String newCode = dataStandard.getCode() + "_copy";
        int suffix = 1;
        while (!dataStandardDao.checkDataStandardCodeUnique(newCode, null)) {
            newCode = dataStandard.getCode() + "_copy" + suffix;
            suffix++;
        }

        DataStandardReq req =
                DataStandardReq.builder()
                        .name(dataStandard.getName() + " (副本)")
                        .code(newCode)
                        .industry(dataStandard.getIndustry())
                        .type(dataStandard.getType())
                        .source(dataStandard.getSource())
                        .description(dataStandard.getDescription())
                        .build();

        return createDataStandard(req);
    }

    @Override
    public List<DataStandardRes> getEnabledDataStandardList() {
        List<DataStandard> allStandards = dataStandardDao.selectAllEnabledDataStandard();
        return allStandards.stream()
                .map(
                        ds ->
                                DataStandardRes.builder()
                                        .id(ds.getId())
                                        .name(ds.getName())
                                        .code(ds.getCode())
                                        .type(ds.getType())
                                        .description(ds.getDescription())
                                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getSchemaById(Long id) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(id);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        DataStandardVersion currentVersion = dataStandardVersionDao.selectCurrentVersion(id);
        if (currentVersion == null) {
            Map<String, Object> emptySchema = new HashMap<>();
            emptySchema.put("fields", new ArrayList<>());
            return emptySchema;
        }

        List<DataStandardField> fields =
                dataStandardFieldDao.selectFieldsByVersionId(currentVersion.getId());

        List<Map<String, String>> schemaFields = new ArrayList<>();
        if (fields != null) {
            for (DataStandardField field : fields) {
                Map<String, String> schemaField = new HashMap<>();
                schemaField.put("name", field.getCode());
                schemaField.put("type", convertDataType(field.getDataType()));
                schemaFields.add(schemaField);
            }
        }

        Map<String, Object> schema = new HashMap<>();
        schema.put("fields", schemaFields);
        return schema;
    }

    private String convertDataType(String dataType) {
        if (dataType == null) {
            return "string";
        }
        switch (dataType) {
            case "字符":
            case "STRING":
                return "string";
            case "数值":
                return "double";
            case "日期":
                return "timestamp";
            case "INT":
                return "int";
            case "BIGINT":
                return "bigint";
            case "FLOAT":
                return "float";
            case "DOUBLE":
                return "double";
            case "DATE":
                return "date";
            case "TIMESTAMP":
                return "timestamp";
            case "BOOLEAN":
                return "boolean";
            default:
                return "string";
        }
    }

    private Long generateId() {
        try {
            return CodeGenerateUtils.getInstance().genCode();
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.JSON_TRANSFORM_FAILED);
        }
    }
}
