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

package org.apache.seatunnel.app.dal.dao;

import org.apache.seatunnel.app.dal.entity.DataStandard;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

public interface IDataStandardDao {

    boolean insertDataStandard(DataStandard dataStandard);

    boolean updateDataStandard(DataStandard dataStandard);

    boolean deleteDataStandard(Long id);

    DataStandard selectDataStandardById(Long id);

    DataStandard selectDataStandardByCode(String code);

    boolean checkDataStandardCodeUnique(String code, Long standardId);

    IPage<DataStandard> selectDataStandardPage(
            Page<DataStandard> page, String name, String type, Integer status);

    List<DataStandard> selectDataStandardByIds(List<Long> ids);

    boolean checkHasVirtualTableReference(Long standardId);
}
