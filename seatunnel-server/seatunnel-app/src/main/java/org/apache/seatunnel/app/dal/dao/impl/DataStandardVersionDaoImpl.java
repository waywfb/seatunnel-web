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

import org.apache.seatunnel.app.dal.dao.IDataStandardVersionDao;
import org.apache.seatunnel.app.dal.entity.DataStandardVersion;
import org.apache.seatunnel.app.dal.mapper.DataStandardVersionMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardVersionDaoImpl implements IDataStandardVersionDao {

    @Resource private DataStandardVersionMapper dataStandardVersionMapper;

    @Override
    public boolean insertVersion(DataStandardVersion version) {
        version.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardVersionMapper.insert(version) > 0;
    }

    @Override
    public boolean updateVersion(DataStandardVersion version) {
        version.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardVersionMapper.updateById(version) > 0;
    }

    @Override
    public boolean deleteVersion(Long id) {
        return dataStandardVersionMapper.delete(
                        new QueryWrapper<DataStandardVersion>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public DataStandardVersion selectVersionById(Long id) {
        return dataStandardVersionMapper.selectOne(
                new QueryWrapper<DataStandardVersion>()
                        .eq("id", id)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardVersion> selectVersionsByStandardId(Long standardId) {
        return dataStandardVersionMapper.selectList(
                new QueryWrapper<DataStandardVersion>()
                        .eq("standard_id", standardId)
                        .eq("workspace_id", getCurrentWorkspaceId())
                        .orderByDesc("create_time"));
    }

    @Override
    public DataStandardVersion selectCurrentVersion(Long standardId) {
        return dataStandardVersionMapper.selectOne(
                new QueryWrapper<DataStandardVersion>()
                        .eq("standard_id", standardId)
                        .eq("is_current", true)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean checkVersionExists(Long standardId, String version) {
        return dataStandardVersionMapper.selectCount(
                        new QueryWrapper<DataStandardVersion>()
                                .eq("standard_id", standardId)
                                .eq("version", version)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean updateIsCurrent(Long standardId, Long versionId, boolean isCurrent) {
        DataStandardVersion version = new DataStandardVersion();
        version.setId(versionId);
        version.setIsCurrent(isCurrent);
        return dataStandardVersionMapper.updateById(version) > 0;
    }
}
