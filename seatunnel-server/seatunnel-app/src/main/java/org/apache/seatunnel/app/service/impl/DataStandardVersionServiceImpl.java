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
import org.apache.seatunnel.app.dal.dao.IDataStandardFieldMappingDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardFormatDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandard;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardVersionReq;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardVersionDetailRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardVersionRes;
import org.apache.seatunnel.app.service.IDataStandardFieldMappingService;
import org.apache.seatunnel.app.service.IDataStandardFieldService;
import org.apache.seatunnel.app.service.IDataStandardFormatService;
import org.apache.seatunnel.app.service.IDataStandardVersionService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentUserId;
import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Service
public class DataStandardVersionServiceImpl extends SeatunnelBaseServiceImpl
        implements IDataStandardVersionService {

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Resource(name = "dataStandardDaoImpl")
    private IDataStandardDao dataStandardDao;

    @Autowired private IDataStandardFieldService dataStandardFieldService;

    @Autowired private IDataStandardFormatService dataStandardFormatService;

    @Autowired private IDataStandardFieldMappingService dataStandardFieldMappingService;

    @Resource(name = "dataStandardFieldDaoImpl")
    private IDataStandardFieldDao dataStandardFieldDao;

    @Resource(name = "dataStandardFormatDaoImpl")
    private IDataStandardFormatDao dataStandardFormatDao;

    @Resource(name = "dataStandardFieldMappingDaoImpl")
    private IDataStandardFieldMappingDao dataStandardFieldMappingDao;

    @Override
    public Long createVersion(Long standardId, DataStandardVersionReq req) {
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(standardId);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        // Check version not exists
        if (dataStandardVersionDao.checkVersionExists(standardId, req.getVersion())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_ALREADY_EXISTS);
        }

        Long versionId = generateId();
        Date now = new Date();

        DataStandardVersion version =
                DataStandardVersion.builder()
                        .id(versionId)
                        .standardId(standardId)
                        .version(req.getVersion())
                        .status("DRAFT")
                        .isCurrent(false)
                        .description(req.getDescription())
                        .workspaceId(getCurrentWorkspaceId())
                        .createUserId(getCurrentUserId())
                        .createTime(now)
                        .build();

        dataStandardVersionDao.insertVersion(version);

        // If this is the first version, set it as current
        List<DataStandardVersion> versions =
                dataStandardVersionDao.selectVersionsByStandardId(standardId);
        if (versions.size() == 1) {
            version.setIsCurrent(true);
            dataStandardVersionDao.updateVersion(version);

            dataStandard.setCurrentVersionId(versionId);
            dataStandardDao.updateDataStandard(dataStandard);
        }

        return versionId;
    }

    @Override
    public boolean updateVersion(Long standardId, Long versionId, DataStandardVersionReq req) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        version.setVersion(req.getVersion());
        version.setDescription(req.getDescription());

        return dataStandardVersionDao.updateVersion(version);
    }

    @Override
    public boolean deleteVersion(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        // Delete related fields, formats, mappings
        dataStandardFieldDao.deleteFieldsByVersionId(versionId);
        dataStandardFormatDao.deleteFormatsByVersionId(versionId);
        dataStandardFieldMappingDao.deleteMappingsByVersionId(versionId);

        return dataStandardVersionDao.deleteVersion(versionId);
    }

    @Override
    public DataStandardVersionDetailRes getVersionDetail(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        return DataStandardVersionDetailRes.builder()
                .id(version.getId())
                .standardId(version.getStandardId())
                .version(version.getVersion())
                .status(version.getStatus())
                .isCurrent(version.getIsCurrent())
                .description(version.getDescription())
                .createUserId(version.getCreateUserId())
                .createTime(version.getCreateTime())
                .fields(dataStandardFieldService.getFieldList(standardId, versionId))
                .formats(dataStandardFormatService.getFormatList(standardId, versionId))
                .mappings(dataStandardFieldMappingService.getMappingList(standardId, versionId))
                .build();
    }

    @Override
    public List<DataStandardVersionRes> getVersionList(Long standardId) {
        List<DataStandardVersion> versions =
                dataStandardVersionDao.selectVersionsByStandardId(standardId);

        return versions.stream()
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
    }

    @Override
    public boolean publishVersion(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        // Unset current version
        DataStandardVersion currentVersion =
                dataStandardVersionDao.selectCurrentVersion(standardId);
        if (currentVersion != null) {
            dataStandardVersionDao.updateIsCurrent(standardId, currentVersion.getId(), false);
        }

        // Set this version as current and published
        version.setStatus("RELEASED");
        version.setIsCurrent(true);
        dataStandardVersionDao.updateVersion(version);

        // Update standard's current version
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(standardId);
        dataStandard.setCurrentVersionId(versionId);
        dataStandardDao.updateDataStandard(dataStandard);

        return true;
    }

    @Override
    public boolean archiveVersion(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"RELEASED".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_RELEASED);
        }

        version.setStatus("ARCHIVED");
        version.setIsCurrent(false);
        return dataStandardVersionDao.updateVersion(version);
    }

    private Long generateId() {
        try {
            return CodeGenerateUtils.getInstance().genCode();
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.JSON_TRANSFORM_FAILED);
        }
    }
}
