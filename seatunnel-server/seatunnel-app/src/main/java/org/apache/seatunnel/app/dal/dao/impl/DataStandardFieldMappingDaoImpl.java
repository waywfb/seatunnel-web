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

package org.apache.seatunnel.app.dal.dao.impl;

import org.apache.seatunnel.app.dal.dao.IDataStandardFieldMappingDao;
import org.apache.seatunnel.app.dal.entity.DataStandardFieldMapping;
import org.apache.seatunnel.app.dal.mapper.DataStandardFieldMappingMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardFieldMappingDaoImpl implements IDataStandardFieldMappingDao {

    @Resource private DataStandardFieldMappingMapper dataStandardFieldMappingMapper;

    @Override
    public boolean insertMapping(DataStandardFieldMapping mapping) {
        mapping.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFieldMappingMapper.insert(mapping) > 0;
    }

    @Override
    public boolean updateMapping(DataStandardFieldMapping mapping) {
        mapping.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFieldMappingMapper.updateById(mapping) > 0;
    }

    @Override
    public boolean deleteMapping(Long id) {
        return dataStandardFieldMappingMapper.delete(
                        new QueryWrapper<DataStandardFieldMapping>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public DataStandardFieldMapping selectMappingById(Long id) {
        return dataStandardFieldMappingMapper.selectOne(
                new QueryWrapper<DataStandardFieldMapping>()
                        .eq("id", id)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardFieldMapping> selectMappingsByVersionId(Long versionId) {
        return dataStandardFieldMappingMapper.selectList(
                new QueryWrapper<DataStandardFieldMapping>()
                        .eq("version_id", versionId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardFieldMapping> selectMappingsByFieldId(Long fieldId) {
        return dataStandardFieldMappingMapper.selectList(
                new QueryWrapper<DataStandardFieldMapping>()
                        .eq("field_id", fieldId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean deleteMappingsByVersionId(Long versionId) {
        return dataStandardFieldMappingMapper.delete(
                        new QueryWrapper<DataStandardFieldMapping>()
                                .eq("version_id", versionId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean deleteMappingsByFieldId(Long fieldId) {
        return dataStandardFieldMappingMapper.delete(
                        new QueryWrapper<DataStandardFieldMapping>()
                                .eq("field_id", fieldId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean batchInsertMappings(List<DataStandardFieldMapping> mappings) {
        mappings.forEach(mapping -> mapping.setWorkspaceId(getCurrentWorkspaceId()));
        return dataStandardFieldMappingMapper.insertBatchSomeColumn(mappings) > 0;
    }
}
