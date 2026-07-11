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

import org.apache.seatunnel.app.dal.dao.IDataStandardFieldDao;
import org.apache.seatunnel.app.dal.entity.DataStandardField;
import org.apache.seatunnel.app.dal.mapper.DataStandardFieldMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardFieldDaoImpl implements IDataStandardFieldDao {

    @Resource private DataStandardFieldMapper dataStandardFieldMapper;

    @Override
    public boolean insertField(DataStandardField field) {
        field.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFieldMapper.insert(field) > 0;
    }

    @Override
    public boolean updateField(DataStandardField field) {
        field.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFieldMapper.updateById(field) > 0;
    }

    @Override
    public boolean deleteField(Long id) {
        return dataStandardFieldMapper.delete(
                        new QueryWrapper<DataStandardField>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public DataStandardField selectFieldById(Long id) {
        return dataStandardFieldMapper.selectOne(
                new QueryWrapper<DataStandardField>()
                        .eq("id", id)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardField> selectFieldsByVersionId(Long versionId) {
        return dataStandardFieldMapper.selectList(
                new QueryWrapper<DataStandardField>()
                        .eq("version_id", versionId)
                        .eq("workspace_id", getCurrentWorkspaceId())
                        .orderByAsc("sort_order"));
    }

    @Override
    public boolean deleteFieldsByVersionId(Long versionId) {
        return dataStandardFieldMapper.delete(
                        new QueryWrapper<DataStandardField>()
                                .eq("version_id", versionId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean batchInsertFields(List<DataStandardField> fields) {
        fields.forEach(field -> field.setWorkspaceId(getCurrentWorkspaceId()));
        return dataStandardFieldMapper.insertBatchSomeColumn(fields) > 0;
    }

    @Override
    public List<DataStandardField> selectFieldsByIds(List<Long> ids) {
        return dataStandardFieldMapper.selectList(
                new QueryWrapper<DataStandardField>()
                        .in("id", ids)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }
}
