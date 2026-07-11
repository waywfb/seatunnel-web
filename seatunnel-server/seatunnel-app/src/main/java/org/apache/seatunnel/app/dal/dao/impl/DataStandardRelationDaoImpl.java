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

import org.apache.seatunnel.app.dal.dao.IDataStandardRelationDao;
import org.apache.seatunnel.app.dal.entity.DataStandardRelation;
import org.apache.seatunnel.app.dal.mapper.DataStandardRelationMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardRelationDaoImpl implements IDataStandardRelationDao {

    @Resource private DataStandardRelationMapper dataStandardRelationMapper;

    @Override
    public boolean insertRelation(DataStandardRelation relation) {
        relation.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardRelationMapper.insert(relation) > 0;
    }

    @Override
    public boolean deleteRelation(Long id) {
        return dataStandardRelationMapper.delete(
                        new QueryWrapper<DataStandardRelation>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean deleteRelationsByStandardId(Long standardId) {
        return dataStandardRelationMapper.delete(
                        new QueryWrapper<DataStandardRelation>()
                                .eq("standard_id", standardId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public List<DataStandardRelation> selectRelationsByStandardId(Long standardId) {
        return dataStandardRelationMapper.selectList(
                new QueryWrapper<DataStandardRelation>()
                        .eq("standard_id", standardId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<DataStandardRelation> selectRelationsByObject(String objectType, Long objectId) {
        return dataStandardRelationMapper.selectList(
                new QueryWrapper<DataStandardRelation>()
                        .eq("object_type", objectType)
                        .eq("object_id", objectId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean checkRelationExists(Long standardId, String objectType, Long objectId) {
        return dataStandardRelationMapper.selectCount(
                        new QueryWrapper<DataStandardRelation>()
                                .eq("standard_id", standardId)
                                .eq("object_type", objectType)
                                .eq("object_id", objectId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }
}
