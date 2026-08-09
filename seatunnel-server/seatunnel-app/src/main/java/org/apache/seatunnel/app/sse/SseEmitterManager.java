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

package org.apache.seatunnel.app.sse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** 通用 SSE 推送注册表：管理 topic 维度的活跃连接与定时推送任务。 */
@Slf4j
@Component
public class SseEmitterManager {

    private static final long DEFAULT_EMITTER_TIMEOUT_MS = 5 * 60 * 1000L;
    private static final long DEFAULT_PUSH_INTERVAL_MS = 5000L;

    private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> pushTasks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler =
            new ScheduledThreadPoolExecutor(
                    1,
                    runnable -> {
                        Thread thread = new Thread(runnable, "sse-push-scheduler");
                        thread.setDaemon(true);
                        return thread;
                    });

    /**
     * 注册定时推送任务。同一 topic 重复注册会被幂等忽略。仅在存在订阅者时执行 provider。
     *
     * @param topic 订阅主题
     * @param provider 数据提供者，返回 null 时跳过本次推送
     * @param intervalMs 推送间隔
     */
    public void register(String topic, SseDataProvider provider, long intervalMs) {
        pushTasks.computeIfAbsent(
                topic,
                key ->
                        scheduler.scheduleAtFixedRate(
                                () -> pushOnce(key, provider),
                                0,
                                intervalMs,
                                TimeUnit.MILLISECONDS));
    }

    /**
     * 建立订阅连接。连接完成/超时/异常时自动从注册表移除。
     *
     * @param topic 订阅主题
     * @return 已注册生命周期回调的 emitter
     */
    public SseEmitter subscribe(String topic) {
        return subscribe(topic, DEFAULT_EMITTER_TIMEOUT_MS);
    }

    public SseEmitter subscribe(String topic, long timeoutMs) {
        SseEmitter emitter = new SseEmitter(timeoutMs);
        emitters.computeIfAbsent(topic, key -> ConcurrentHashMap.newKeySet()).add(emitter);
        emitter.onCompletion(() -> remove(topic, emitter));
        emitter.onTimeout(() -> remove(topic, emitter));
        emitter.onError(error -> remove(topic, emitter));
        return emitter;
    }

    /** 向指定 topic 的所有活跃连接推送数据。 */
    public void broadcast(String topic, Object data) {
        Set<SseEmitter> topicEmitters = emitters.get(topic);
        if (topicEmitters == null || topicEmitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : topicEmitters) {
            try {
                emitter.send(
                        SseEmitter.event().name("message").data(data, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                remove(topic, emitter);
            } catch (IllegalStateException e) {
                log.debug("Emitter for topic {} already completed", topic);
                remove(topic, emitter);
            }
        }
    }

    private void pushOnce(String topic, SseDataProvider provider) {
        if (isTopicEmpty(topic)) {
            return;
        }
        try {
            Object data = provider.provide();
            if (data != null) {
                broadcast(topic, data);
            }
        } catch (Exception e) {
            log.warn("SSE push failed for topic [{}]", topic, e);
        }
    }

    private void remove(String topic, SseEmitter emitter) {
        Set<SseEmitter> topicEmitters = emitters.get(topic);
        if (topicEmitters != null) {
            topicEmitters.remove(emitter);
            if (topicEmitters.isEmpty()) {
                emitters.remove(topic);
            }
        }
        try {
            emitter.complete();
        } catch (IllegalStateException e) {
            log.debug("Emitter for topic {} already completed", topic);
        }
    }

    private boolean isTopicEmpty(String topic) {
        Set<SseEmitter> topicEmitters = emitters.get(topic);
        return topicEmitters == null || topicEmitters.isEmpty();
    }

    @FunctionalInterface
    public interface SseDataProvider {
        Object provide() throws Exception;
    }
}
