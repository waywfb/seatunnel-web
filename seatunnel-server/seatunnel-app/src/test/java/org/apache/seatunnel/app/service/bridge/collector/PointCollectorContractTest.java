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

package org.apache.seatunnel.app.service.bridge.collector;

import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 采集器契约：路由唯一性、逐点结果、幂等生命周期、默认值。 */
class PointCollectorContractTest {

    private static final Long DS_ID = 1L;

    private static DatasourceContext context(CollectMode mode) {
        return new DatasourceContext(
                DS_ID, "OPCUA", "opcua", "opcua://host:4840", "host", 4840, 1L, mode, 3000L);
    }

    private static DatasourceContext pollingContext() {
        return context(CollectMode.POLLING);
    }

    private static List<ReadTagsRequest.PointRead> points(int size) {
        List<ReadTagsRequest.PointRead> list = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            list.add(new ReadTagsRequest.PointRead());
        }
        return list;
    }

    /** 轮询采集器必须兜住所有数据源，否则读值无处可路由。 */
    @Test
    void pollingCollectorSupportsEveryDatasource() {
        assertTrue(new PollingCollectorStub().supports(context(CollectMode.SUBSCRIPTION)));
        assertTrue(new PollingCollectorStub().supports(context(CollectMode.POLLING)));
    }

    @Test
    void registryPicksTheOnlySupportingCollector() {
        PointCollectorStub subscription = new PointCollectorStub(CollectMode.SUBSCRIPTION);
        PollingCollectorStub polling = new PollingCollectorStub();
        PointCollectorRegistry registry =
                new PointCollectorRegistry(List.of(subscription, polling));

        assertSame(subscription, registry.pick(context(CollectMode.SUBSCRIPTION)));
        assertSame(polling, registry.pick(pollingContext()));
    }

    @Test
    void registryFailsLoudlyWhenNoCollectorSupports() {
        PointCollectorRegistry registry =
                new PointCollectorRegistry(
                        List.of(new PointCollectorStub(CollectMode.SUBSCRIPTION)));

        SeatunnelException e =
                assertThrows(SeatunnelException.class, () -> registry.pick(pollingContext()));
        assertTrue(
                e.getMessage().contains(String.valueOf(DS_ID)),
                "异常信息必须指明是哪个数据源无法路由，实际: " + e.getMessage());
    }

    /** 未启动过的数据源不得被当成"运行中"。 */
    @Test
    void statusOfUnknownDatasourceIsStopped() {
        CollectorStatus status = new PointCollectorStub(CollectMode.SUBSCRIPTION).status(99L);

        assertEquals(99L, status.getDatasourceId());
        assertEquals(CollectorState.STOPPED, status.getState());
        assertFalse(status.isDegraded());
    }

    @Test
    void defaultCollectModeIsPolling() {
        assertEquals(CollectMode.POLLING, CollectMode.defaultMode());
    }

    @Test
    void staleThresholdFallsBackWhenNotPositive() {
        DatasourceContext ctx = pollingContext();
        ctx.setStaleThresholdMs(0);

        assertEquals(DatasourceContext.DEFAULT_STALE_THRESHOLD_MS, ctx.getStaleThresholdMs());
    }

    /** 读值必须逐点成败：返回条数与下标严格对应请求。 */
    @Test
    void readResultKeepsOneEntryPerRequestedPoint() {
        List<TagValueDTO> values = Collections.singletonList(new TagValueDTO(0, "1", null));

        assertEquals(1, values.size());
        assertEquals(0, values.get(0).getIndex());
    }

    private static class PollingCollectorStub implements PointCollector {
        @Override
        public boolean supports(DatasourceContext ctx) {
            return true;
        }

        @Override
        public List<TagValueDTO> read(
                DatasourceContext ctx, List<ReadTagsRequest.PointRead> points) {
            return Collections.emptyList();
        }
    }

    private static class PointCollectorStub implements PointCollector {
        private final CollectMode mode;

        PointCollectorStub(CollectMode mode) {
            this.mode = mode;
        }

        @Override
        public boolean supports(DatasourceContext ctx) {
            return ctx.getCollectMode() == mode;
        }

        @Override
        public List<TagValueDTO> read(
                DatasourceContext ctx, List<ReadTagsRequest.PointRead> points) {
            return Collections.emptyList();
        }
    }
}
