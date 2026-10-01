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
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.bridge.collector.CollectMode;
import org.apache.seatunnel.app.service.bridge.collector.DatasourceContext;
import org.apache.seatunnel.app.service.bridge.collector.PointCollector;
import org.apache.seatunnel.app.service.bridge.collector.PointCollectorRegistry;
import org.apache.seatunnel.app.service.bridge.collector.ReadValuesResponse;
import org.apache.seatunnel.app.service.impl.SeatunnelBaseServiceImpl;
import org.apache.seatunnel.common.access.AccessInfo;
import org.apache.seatunnel.common.access.AccessType;
import org.apache.seatunnel.common.access.ResourceType;
import org.apache.seatunnel.common.access.SeatunnelAccessController;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** 在线读值直连 PLC，读之前必须先过数据源读权限，并按数据源存在与否区分错误码。 */
class BridgeClientReadPermissionTest {

    private static final Long DATASOURCE_ID = 7L;
    private static final String DATASOURCE_NAME = "plc_line_1";

    private IDatasourceDao datasourceDao;
    private SeatunnelAccessController accessController;
    private RecordingCollector collector;
    private BridgeClientImpl bridgeClient;

    @BeforeEach
    void setUp() {
        datasourceDao = Mockito.mock(IDatasourceDao.class);
        accessController = Mockito.mock(SeatunnelAccessController.class);
        collector = new RecordingCollector();
        bridgeClient =
                new BridgeClientImpl(datasourceDao, new PointCollectorRegistry(List.of(collector)));
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

    private Datasource datasource(String name) {
        Datasource datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        datasource.setDatasourceName(name);
        datasource.setPluginName("OPCUA");
        datasource.setDatasourceConfig("{\"host\":\"127.0.0.1\",\"port\":\"4840\"}");
        datasource.setWorkspaceId(1L);
        return datasource;
    }

    private ReadTagsRequest request() {
        ReadTagsRequest request = new ReadTagsRequest();
        request.setDatasourceId(DATASOURCE_ID);
        return request;
    }

    /** 无权限时必须抛出 AccessDeniedException，且不进入采集流程。 */
    @Test
    void readRejectsWhenAccessDenied() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource(DATASOURCE_NAME));
        Mockito.doThrow(new AccessDeniedException("权限不足"))
                .when(accessController)
                .authorizeAccess(
                        Mockito.eq(DATASOURCE_NAME),
                        Mockito.eq(ResourceType.DATASOURCE),
                        Mockito.eq(AccessType.READ),
                        Mockito.any());

        AccessDeniedException error =
                assertThrows(AccessDeniedException.class, () -> bridgeClient.read(request()));
        assertEquals("权限不足", error.getMessage());
    }

    /** 权限校验必须使用数据源名称，而不是 id。 */
    @Test
    void readChecksPermissionByDatasourceName() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource(DATASOURCE_NAME));
        Mockito.doThrow(new AccessDeniedException("权限不足"))
                .when(accessController)
                .authorizeAccess(Mockito.anyString(), Mockito.any(), Mockito.any(), Mockito.any());

        assertThrows(AccessDeniedException.class, () -> bridgeClient.read(request()));

        ArgumentCaptor<String> resourceName = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<ResourceType> resourceType = ArgumentCaptor.forClass(ResourceType.class);
        ArgumentCaptor<AccessType> accessType = ArgumentCaptor.forClass(AccessType.class);
        ArgumentCaptor<AccessInfo> accessInfo = ArgumentCaptor.forClass(AccessInfo.class);
        Mockito.verify(accessController)
                .authorizeAccess(
                        resourceName.capture(),
                        resourceType.capture(),
                        accessType.capture(),
                        accessInfo.capture());
        assertEquals(DATASOURCE_NAME, resourceName.getValue());
        assertSame(ResourceType.DATASOURCE, resourceType.getValue());
        assertSame(AccessType.READ, accessType.getValue());
        assertSame(UserContextHolder.getAccessInfo(), accessInfo.getValue());
    }

    /** 数据源不存在时返回 DATASOURCE_NOT_FOUND，而不是笼统的 UNKNOWN。 */
    @Test
    void readRejectsWhenDatasourceMissing() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID)).thenReturn(null);

        SeatunnelException error =
                assertThrows(SeatunnelException.class, () -> bridgeClient.read(request()));
        assertEquals(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, error.getErrorEnum());
        Mockito.verifyNoInteractions(accessController);
    }

    /** 数据源名称缺失同样按不存在处理，避免拿 null 去查权限。 */
    @Test
    void readRejectsWhenDatasourceNameMissing() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource(null));

        SeatunnelException error =
                assertThrows(SeatunnelException.class, () -> bridgeClient.read(request()));
        assertEquals(SeatunnelErrorEnum.DATASOURCE_NOT_FOUND, error.getErrorEnum());
        Mockito.verifyNoInteractions(accessController);
    }

    /** 缺少 datasourceId 时先报参数错误，不触碰数据源与权限。 */
    @Test
    void readRejectsWhenDatasourceIdMissing() {
        ReadTagsRequest request = new ReadTagsRequest();

        assertThrows(SeatunnelException.class, () -> bridgeClient.read(request));
        Mockito.verifyNoInteractions(datasourceDao, accessController);
    }

    /** 权限校验通过后必须继续走采集流程，并原样返回采集模式。 */
    @Test
    void readContinuesToCollectorWhenPermitted() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource(DATASOURCE_NAME));
        Mockito.doNothing()
                .when(accessController)
                .authorizeAccess(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());

        ReadValuesResponse response = bridgeClient.read(request());

        assertSame(CollectMode.POLLING, response.getCollectMode());
        assertFalse(response.isDegraded());
        assertSame(DATASOURCE_ID, collector.lastContext.getDatasourceId());
        Mockito.verify(accessController)
                .authorizeAccess(
                        Mockito.eq(DATASOURCE_NAME),
                        Mockito.eq(ResourceType.DATASOURCE),
                        Mockito.eq(AccessType.READ),
                        Mockito.any());
    }

    /** 无权限时采集器一次都不能被调用，避免绕过控制器直连 PLC。 */
    @Test
    void collectorIsNotInvokedWhenAccessDenied() {
        Mockito.when(datasourceDao.selectDatasourceById(DATASOURCE_ID))
                .thenReturn(datasource(DATASOURCE_NAME));
        Mockito.doThrow(new AccessDeniedException("权限不足"))
                .when(accessController)
                .authorizeAccess(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());

        assertThrows(AccessDeniedException.class, () -> bridgeClient.read(request()));
        assertEquals(0, collector.invocations);
    }

    /** 基类权限桥接仍然生效，避免直接绕过 SeatunnelBaseServiceImpl。 */
    @Test
    void inheritsPermissionCheckFromBaseService() {
        assertSame(SeatunnelBaseServiceImpl.class, BridgeClientImpl.class.getSuperclass());
    }

    /** 记录调用次数的采集器桩，用于断言权限校验的拦截位置。 */
    private static final class RecordingCollector implements PointCollector {

        private int invocations;
        private DatasourceContext lastContext;

        @Override
        public boolean supports(DatasourceContext ctx) {
            return true;
        }

        @Override
        public List<TagValueDTO> read(
                DatasourceContext ctx, List<ReadTagsRequest.PointRead> points) {
            invocations++;
            lastContext = ctx;
            return Collections.emptyList();
        }
    }
}
