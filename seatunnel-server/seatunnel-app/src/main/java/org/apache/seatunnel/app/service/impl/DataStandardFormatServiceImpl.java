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

import org.apache.seatunnel.app.dal.dao.IDataStandardFormatDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandardFormat;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFormatReq;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFormatRes;
import org.apache.seatunnel.app.service.IDataStandardFormatService;
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
public class DataStandardFormatServiceImpl extends SeatunnelBaseServiceImpl
        implements IDataStandardFormatService {

    @Resource(name = "dataStandardFormatDaoImpl")
    private IDataStandardFormatDao dataStandardFormatDao;

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Override
    public List<DataStandardFormatRes> getFormatList(Long standardId, Long versionId) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        List<DataStandardFormat> formats =
                dataStandardFormatDao.selectFormatsByVersionId(versionId);

        return formats.stream().map(this::toFormatRes).collect(Collectors.toList());
    }

    @Override
    public List<DataStandardFormatRes> batchUpdateFormats(
            Long standardId, Long versionId, List<DataStandardFormatReq> formatReqs) {
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        if (!"DRAFT".equals(version.getStatus())) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_DRAFT);
        }

        // Delete existing formats
        dataStandardFormatDao.deleteFormatsByVersionId(versionId);

        if (CollectionUtils.isEmpty(formatReqs)) {
            return new ArrayList<>();
        }

        List<DataStandardFormat> formats =
                formatReqs.stream()
                        .map(
                                req -> {
                                    Long formatId = generateId();
                                    Date now = new Date();

                                    return DataStandardFormat.builder()
                                            .id(formatId)
                                            .versionId(versionId)
                                            .formatType(req.getFormatType())
                                            .fileType(req.getFileType())
                                            .recordSeparator(req.getRecordSeparator())
                                            .fieldSeparator(req.getFieldSeparator())
                                            .encoding(req.getEncoding())
                                            .headerRows(req.getHeaderRows())
                                            .quoteChar(req.getQuoteChar())
                                            .escapeChar(req.getEscapeChar())
                                            .fileTerminator(req.getFileTerminator())
                                            .description(req.getDescription())
                                            .workspaceId(getCurrentWorkspaceId())
                                            .createTime(now)
                                            .updateTime(now)
                                            .build();
                                })
                        .collect(Collectors.toList());

        dataStandardFormatDao.batchInsertFormats(formats);

        return formats.stream().map(this::toFormatRes).collect(Collectors.toList());
    }

    private DataStandardFormatRes toFormatRes(DataStandardFormat format) {
        return DataStandardFormatRes.builder()
                .id(format.getId())
                .versionId(format.getVersionId())
                .formatType(format.getFormatType())
                .fileType(format.getFileType())
                .recordSeparator(format.getRecordSeparator())
                .fieldSeparator(format.getFieldSeparator())
                .encoding(format.getEncoding())
                .headerRows(format.getHeaderRows())
                .quoteChar(format.getQuoteChar())
                .escapeChar(format.getEscapeChar())
                .fileTerminator(format.getFileTerminator())
                .description(format.getDescription())
                .createTime(format.getCreateTime())
                .updateTime(format.getUpdateTime())
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
