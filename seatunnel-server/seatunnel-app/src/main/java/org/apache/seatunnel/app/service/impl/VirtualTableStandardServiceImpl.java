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
import org.apache.seatunnel.app.dal.dao.IDataStandardRelationDao;
import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.dao.IVirtualTableStandardDao;
import org.apache.seatunnel.app.dal.entity.DataStandard;
import org.apache.seatunnel.app.dal.entity.DataStandardRelation;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.dal.entity.VirtualTableStandard;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardRelationRes;
import org.apache.seatunnel.app.domain.response.datastandard.VirtualTableStandardRes;
import org.apache.seatunnel.app.service.IVirtualTableStandardService;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.stereotype.Service;

import javax.annotation.Resource;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Service
public class VirtualTableStandardServiceImpl extends SeatunnelBaseServiceImpl
        implements IVirtualTableStandardService {

    @Resource(name = "virtualTableStandardDaoImpl")
    private IVirtualTableStandardDao virtualTableStandardDao;

    @Resource(name = "dataStandardRelationDaoImpl")
    private IDataStandardRelationDao dataStandardRelationDao;

    @Resource(name = "dataStandardDaoImpl")
    private IDataStandardDao dataStandardDao;

    @Resource(name = "dataStandardVersionDaoImpl")
    private IDataStandardVersionDao dataStandardVersionDao;

    @Override
    public boolean bindVirtualTable(
            Long virtualTableId, Long standardId, Long versionId, String snapshot) {
        // Check standard exists
        DataStandard dataStandard = dataStandardDao.selectDataStandardById(standardId);
        if (dataStandard == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_NOT_FOUND);
        }

        // Check version exists
        DataStandardVersion version = dataStandardVersionDao.selectVersionById(versionId);
        if (version == null || !version.getStandardId().equals(standardId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.DATA_STANDARD_VERSION_NOT_FOUND);
        }

        // Check if already bound, unbind first
        VirtualTableStandard existing =
                virtualTableStandardDao.selectByVirtualTableId(virtualTableId);
        if (existing != null) {
            virtualTableStandardDao.deleteByVirtualTableId(virtualTableId);
        }

        Long id = generateId();
        Date now = new Date();

        VirtualTableStandard vts =
                VirtualTableStandard.builder()
                        .id(id)
                        .virtualTableId(virtualTableId)
                        .standardId(standardId)
                        .standardVersionId(versionId)
                        .workspaceId(getCurrentWorkspaceId())
                        .createTime(now)
                        .build();

        virtualTableStandardDao.insertVirtualTableStandard(vts);

        // Create relation display record
        DataStandardRelation relation =
                DataStandardRelation.builder()
                        .id(generateId())
                        .standardId(standardId)
                        .objectType("VIRTUAL_TABLE")
                        .objectId(virtualTableId)
                        .workspaceId(getCurrentWorkspaceId())
                        .createTime(now)
                        .build();
        dataStandardRelationDao.insertRelation(relation);

        return true;
    }

    @Override
    public boolean unbindVirtualTable(Long virtualTableId) {
        VirtualTableStandard vts = virtualTableStandardDao.selectByVirtualTableId(virtualTableId);
        if (vts == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.VIRTUAL_TABLE_STANDARD_NOT_BOUND);
        }

        virtualTableStandardDao.deleteByVirtualTableId(virtualTableId);

        // Delete relation record
        DataStandardRelation relation =
                dataStandardRelationDao.selectRelationsByObject("VIRTUAL_TABLE", virtualTableId)
                        .stream()
                        .findFirst()
                        .orElse(null);
        if (relation != null) {
            dataStandardRelationDao.deleteRelation(relation.getId());
        }

        return true;
    }

    @Override
    public VirtualTableStandardRes getBindingByVirtualTableId(Long virtualTableId) {
        VirtualTableStandard vts = virtualTableStandardDao.selectByVirtualTableId(virtualTableId);
        if (vts == null) {
            return null;
        }

        DataStandard dataStandard = dataStandardDao.selectDataStandardById(vts.getStandardId());
        DataStandardVersion version =
                dataStandardVersionDao.selectVersionById(vts.getStandardVersionId());

        return VirtualTableStandardRes.builder()
                .id(vts.getId())
                .virtualTableId(vts.getVirtualTableId())
                .standardId(vts.getStandardId())
                .standardName(dataStandard != null ? dataStandard.getName() : null)
                .standardVersionId(vts.getStandardVersionId())
                .standardVersion(version != null ? version.getVersion() : null)
                .createTime(vts.getCreateTime())
                .build();
    }

    @Override
    public List<DataStandardRelationRes> getRelationList(Long standardId) {
        List<DataStandardRelation> relations =
                dataStandardRelationDao.selectRelationsByStandardId(standardId);

        return relations.stream().map(this::toRelationRes).collect(Collectors.toList());
    }

    @Override
    public List<DataStandardRelationRes> getRelationListByStandardIdAndVersionId(
            Long standardId, Long versionId) {
        // Relation table doesn't have versionId, filter by standardId only
        List<DataStandardRelation> relations =
                dataStandardRelationDao.selectRelationsByStandardId(standardId);

        return relations.stream().map(this::toRelationRes).collect(Collectors.toList());
    }

    private DataStandardRelationRes toRelationRes(DataStandardRelation relation) {
        return DataStandardRelationRes.builder()
                .id(relation.getId())
                .standardId(relation.getStandardId())
                .objectType(relation.getObjectType())
                .objectId(relation.getObjectId())
                .createTime(relation.getCreateTime())
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
