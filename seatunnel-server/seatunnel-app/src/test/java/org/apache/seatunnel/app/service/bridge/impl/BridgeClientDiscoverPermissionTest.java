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

package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.app.dal.dao.IDatasourceDao;
import org.apache.seatunnel.app.dal.entity.Datasource;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.bridge.collector.PointCollectorRegistry;
import org.apache.seatunnel.common.access.AccessInfo;
import org.apache.seatunnel.common.access.AccessType;
import org.apache.seatunnel.common.access.ResourceType;
import org.apache.seatunnel.common.access.SeatunnelAccessController;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** 浏览测点只能连数据源配置里的地址，且必须先过数据源读权限。 */
class BridgeClientDiscoverPermissionTest {

    private static final Long DATASOURCE_ID = 9L;
    private static final String DATASOURCE_NAME = "opc_server";

    private IDatasourceDao datasourceDao;
    private SeatunnelAccessController accessController;
    private BridgeClientImpl bridgeClient;

    @BeforeEach
    void setUp() {
        datasourceDao = Mockito.mock(IDatasourceDao.class);
        accessController = Mockito.mock(SeatunnelAccessController.class);
        bridgeClient =
                new BridgeClientImpl(
                        datasourceDao, new PointCollectorRegistry(Collections.emptyList()));
        ReflectionTestUtils.setField(bridgeClient, "seatunnelAccessController", accessController);

        AccessInfo accessInfo = new AccessInfo();
        accessInfo.setUsername("tester");
        accessInfo.setWorkspaceName("default");
        accessInfo.setUserGroups(Collections.emptySet());
        accessInfo.setUserRoles(Collections.emptySet());
        UserContextHolder.setUserContext(new UserContext(null, 1L, accessInfo));
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    private Datasource datasource(String pluginName, String config) {
        Datasource datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        datasource.setDatasourceName(DATASOURCE_NAME);
        datasource.setPluginName(pluginName);
        datasource.setDatasourceConfig(config);
        datasource.setWorkspaceId(1L);
        return datasource;
    }

    private DiscoverRequestDTO request(Long datasourceId) {
        DiscoverRequestDTO request = new DiscoverRequestDTO();
        request.setDatasourceId(datasourceId);
        return request;
    }

    /** DTO 不再有 connectionId，调用方无法自带连接串。 */
    @Test
    void discoverRequestHasNoConnectionIdField() {
        List<String> fields =
                List.of(DiscoverRequestDTO.class.getDeclaredFields()).stream()
                        .map(java.lang.reflect.Field::getName)
                        .toList();
        assertEquals(List.of("datasourceId", "parentNodeId", "limit", "offset"), fields);
    }

    /** 缺少 datasourceId 时先报参数错误，不触碰数据源与权限。 */
    @Test
    void discoverRejectsWhenDatasourceIdMissing() {
        assertThrows(SeatunnelException.class, () -> bridgeClient.discover(request(null)));
        Mockito.verifyNoInteractions(datasourceDao, accessController);
    }

    /** 无权限时不得发起任何连接。 */
    @Test
    void discoverRejectsWhenAccessDenied() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource("OPCUA", "{\"host\":\"10.0.0.1\",\"port\":\"4840\"}"));
        Mockito.doThrow(new AccessDeniedException("权限不足"))
                .when(accessController)
                .authorizeAccess(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());

        AccessDeniedException error =
                assertThrows(
                        AccessDeniedException.class,
                        () -> bridgeClient.discover(request(DATASOURCE_ID)));
        assertEquals("权限不足", error.getMessage());
    }

    /** 连接地址只能来自数据源配置，调用方给不了任何连接串。 */
    @Test
    void discoverReadsAddressFromDatasourceConfigOnly() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource("OPCUA", "{\"host\":\"10.0.0.1\",\"port\":\"4840\"}"));

        assertEquals("opcua://10.0.0.1:4840", bridgeClient.resolveConnectionId("9"));
    }

    /** 数据源配置缺 host/port 时直接报错，不回退到任何外部输入。 */
    @Test
    void discoverRejectsWhenHostPortMissingFromConfig() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource("OPCUA", "{\"nodeId\":\"ns=2;s=Root\"}"));

        SeatunnelException error =
                assertThrows(
                        SeatunnelException.class,
                        () -> bridgeClient.discover(request(DATASOURCE_ID)));
        assertEquals(SeatunnelErrorEnum.UNKNOWN, error.getErrorEnum());
    }

    /** 数据源不存在返回 DATASOURCE_NOT_FOUND。 */
    @Test
    void discoverRejectsWhenDatasourceMissing() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID)).thenReturn(null);

        SeatunnelException error =
                assertThrows(
                        SeatunnelException.class,
                        () -> bridgeClient.discover(request(DATASOURCE_ID)));
        assertEquals(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, error.getErrorEnum());
        Mockito.verifyNoInteractions(accessController);
    }

    /** Modbus 不支持浏览，但权限校验必须先于协议能力判断。 */
    @Test
    void discoverChecksPermBeforeProtocolSupport() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource("Modbus", "{\"host\":\"10.0.0.1\",\"port\":\"502\"}"));

        bridgeClient.discover(request(DATASOURCE_ID));

        Mockito.verify(accessController)
                .authorizeAccess(
                        Mockito.eq(DATASOURCE_NAME),
                        Mockito.eq(ResourceType.DATASOURCE),
                        Mockito.eq(AccessType.READ),
                        Mockito.any());
    }
}
