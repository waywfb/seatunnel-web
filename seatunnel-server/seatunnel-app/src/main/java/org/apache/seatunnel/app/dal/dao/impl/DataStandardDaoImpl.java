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

import org.apache.seatunnel.app.dal.dao.IDataStandardDao;
import org.apache.seatunnel.app.dal.entity.DataStandard;
import org.apache.seatunnel.app.dal.mapper.DataStandardMapper;

import org.apache.commons.lang3.StringUtils;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class DataStandardDaoImpl implements IDataStandardDao {

    @Resource private DataStandardMapper dataStandardMapper;

    @Override
    public boolean insertDataStandard(DataStandard dataStandard) {
        dataStandard.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardMapper.insert(dataStandard) > 0;
    }

    @Override
    public boolean updateDataStandard(DataStandard dataStandard) {
        dataStandard.setWorkspaceId(getCurrentWorkspaceId());
        return dataStandardMapper.updateById(dataStandard) > 0;
    }

    @Override
    public boolean deleteDataStandard(Long id) {
        return dataStandardMapper.delete(
                        new QueryWrapper<DataStandard>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public DataStandard selectDataStandardById(Long id) {
        return dataStandardMapper.selectOne(
                new QueryWrapper<DataStandard>()
                        .eq("id", id)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public DataStandard selectDataStandardByCode(String code) {
        return dataStandardMapper.selectOne(
                new QueryWrapper<DataStandard>()
                        .eq("code", code)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean checkDataStandardCodeUnique(String code, Long standardId) {
        return dataStandardMapper.checkDataStandardCodeUnique(
                        standardId, code, getCurrentWorkspaceId())
                <= 0;
    }

    @Override
    public IPage<DataStandard> selectDataStandardPage(
            Page<DataStandard> page, String name, String industry, Integer status) {
        QueryWrapper<DataStandard> queryWrapper =
                new QueryWrapper<DataStandard>()
                        .eq("workspace_id", getCurrentWorkspaceId())
                        .orderByDesc("create_time");
        if (StringUtils.isNotBlank(name)) {
            queryWrapper.like("name", "%" + name + "%");
        }
        if (StringUtils.isNotBlank(industry)) {
            queryWrapper.eq("industry", industry);
        }
        if (status != null) {
            queryWrapper.eq("status", status);
        }
        return dataStandardMapper.selectPage(page, queryWrapper);
    }

    @Override
    public List<DataStandard> selectDataStandardByIds(List<Long> ids) {
        return dataStandardMapper.selectBatchIds(ids);
    }

    @Override
    public boolean checkHasVirtualTableReference(Long standardId) {
        return dataStandardMapper.checkHasVirtualTableReference(standardId, getCurrentWorkspaceId())
                > 0;
    }
}
