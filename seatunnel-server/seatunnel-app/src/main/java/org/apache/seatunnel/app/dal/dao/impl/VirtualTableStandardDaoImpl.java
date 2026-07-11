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

import org.apache.seatunnel.app.dal.dao.IVirtualTableStandardDao;
import org.apache.seatunnel.app.dal.entity.VirtualTableStandard;
import org.apache.seatunnel.app.dal.mapper.VirtualTableStandardMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import javax.annotation.Resource;

import java.util.List;

import static org.apache.seatunnel.app.utils.ServletUtils.getCurrentWorkspaceId;

@Repository
public class VirtualTableStandardDaoImpl implements IVirtualTableStandardDao {

    @Resource private VirtualTableStandardMapper virtualTableStandardMapper;

    @Override
    public boolean insertVirtualTableStandard(VirtualTableStandard virtualTableStandard) {
        virtualTableStandard.setWorkspaceId(getCurrentWorkspaceId());
        return virtualTableStandardMapper.insert(virtualTableStandard) > 0;
    }

    @Override
    public boolean deleteVirtualTableStandard(Long id) {
        return virtualTableStandardMapper.delete(
                        new QueryWrapper<VirtualTableStandard>()
                                .eq("id", id)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public boolean deleteByVirtualTableId(Long virtualTableId) {
        return virtualTableStandardMapper.delete(
                        new QueryWrapper<VirtualTableStandard>()
                                .eq("virtual_table_id", virtualTableId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }

    @Override
    public VirtualTableStandard selectByVirtualTableId(Long virtualTableId) {
        return virtualTableStandardMapper.selectOne(
                new QueryWrapper<VirtualTableStandard>()
                        .eq("virtual_table_id", virtualTableId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public List<VirtualTableStandard> selectByStandardId(Long standardId) {
        return virtualTableStandardMapper.selectList(
                new QueryWrapper<VirtualTableStandard>()
                        .eq("standard_id", standardId)
                        .eq("workspace_id", getCurrentWorkspaceId()));
    }

    @Override
    public boolean checkExists(Long virtualTableId) {
        return virtualTableStandardMapper.selectCount(
                        new QueryWrapper<VirtualTableStandard>()
                                .eq("virtual_table_id", virtualTableId)
                                .eq("workspace_id", getCurrentWorkspaceId()))
                > 0;
    }
}
