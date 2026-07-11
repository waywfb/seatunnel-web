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

import org.apache.seatunnel.app.dal.dao.IDataStandardFormatDao;
import org.apache.seatunnel.app.dal.entity.DataStandardFormat;
import org.apache.seatunnel.app.dal.mapper.DataStandardFormatMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardFormatDaoImpl implements IDataStandardFormatDao {

    @Resource private DataStandardFormatMapper dataStandardFormatMapper;

    @Override
    public boolean insertFormat(DataStandardFormat format) {
        format.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFormatMapper.insert(format) > 0;
    }

    @Override
    public boolean updateFormat(DataStandardFormat format) {
        format.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardFormatMapper.updateById(format) > 0;
    }

    @Override
    public boolean deleteFormat(Long id) {
        return dataStandardFormatMapper.delete(
                        new QueryWrapper<DataStandardFormat>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public DataStandardFormat selectFormatById(Long id) {
        return dataStandardFormatMapper.selectOne(
                new QueryWrapper<DataStandardFormat>()
                        .eq("id", id)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardFormat> selectFormatsByVersionId(Long versionId) {
        return dataStandardFormatMapper.selectList(
                new QueryWrapper<DataStandardFormat>()
                        .eq("version_id", versionId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean deleteFormatsByVersionId(Long versionId) {
        return dataStandardFormatMapper.delete(
                        new QueryWrapper<DataStandardFormat>()
                                .eq("version_id", versionId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean batchInsertFormats(List<DataStandardFormat> formats) {
        formats.forEach(format -> format.setWorkspaceId(getCurrentWorkspaceId()));
        return dataStandardFormatMapper.insertBatchSomeColumn(formats) > 0;
    }
}
