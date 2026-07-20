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

package org.apache.seatunnel.app.service;

import org.apache.seatunnel.app.domain.request.datastandard.DataStandardReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardDetailRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardRes;

import java.util.List;

public interface IDataStandardService {

    Long createDataStandard(DataStandardReq req);

    boolean updateDataStandard(Long id, DataStandardReq req);

    boolean deleteDataStandard(Long id);

    DataStandardDetailRes getDataStandardDetail(Long id);

    PageInfo<DataStandardRes> getDataStandardPage(
            String name, String type, Integer status, Integer pageNo, Integer pageSize);

    boolean enableDataStandard(Long id);

    boolean disableDataStandard(Long id);

    Long copyDataStandard(Long id);

    List<DataStandardRes> getEnabledDataStandardList();
}
