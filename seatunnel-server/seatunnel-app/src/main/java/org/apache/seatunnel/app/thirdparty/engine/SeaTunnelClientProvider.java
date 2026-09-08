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

package org.apache.seatunnel.app.thirdparty.engine;

import org.apache.seatunnel.engine.client.SeaTunnelClient;
import org.apache.seatunnel.engine.common.config.ConfigProvider;

import com.hazelcast.client.config.ClientConfig;
import com.hazelcast.client.config.ClientConnectionStrategyConfig;
import com.hazelcast.client.config.ConnectionRetryConfig;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
public final class SeaTunnelClientProvider {
    private static final AtomicReference<SeaTunnelClient> CLIENT_REF = new AtomicReference<>();
    private static final ReentrantLock RECONNECT_LOCK = new ReentrantLock();
    private static volatile ClientConfig clientConfig;

    static {
        clientConfig = ConfigProvider.locateAndGetClientConfig();
        ConnectionRetryConfig retryConfig =
                new ConnectionRetryConfig().setClusterConnectTimeoutMillis(5000);
        ClientConnectionStrategyConfig strategyConfig =
                new ClientConnectionStrategyConfig().setConnectionRetryConfig(retryConfig);
        clientConfig.setConnectionStrategyConfig(strategyConfig);
    }

    private SeaTunnelClientProvider() {}

    public static SeaTunnelClient getClient() {
        SeaTunnelClient client = CLIENT_REF.get();
        if (client == null) {
            RECONNECT_LOCK.lock();
            try {
                if (CLIENT_REF.get() == null) {
                    client = new SeaTunnelClient(clientConfig);
                    CLIENT_REF.set(client);
                }
            } finally {
                RECONNECT_LOCK.unlock();
            }
        }
        return CLIENT_REF.get();
    }

    /** 熔断重建：仅当当前实例确为失败实例时才执行替换 */
    public static void invalidateAndReconnect(SeaTunnelClient failedInstance) {
        if (failedInstance == null) {
            return;
        }
        RECONNECT_LOCK.lock();
        try {
            if (CLIENT_REF.compareAndSet(failedInstance, null)) {
                try {
                    failedInstance.close();
                } catch (Exception e) {
                    log.warn("Failed to close invalidated SeaTunnelClient.", e);
                }
            }
        } finally {
            RECONNECT_LOCK.unlock();
        }
    }
}
