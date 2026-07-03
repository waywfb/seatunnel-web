package org.apache.seatunnel.plc4x.bridge.service;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.messages.PlcSubscriptionEvent;
import org.apache.plc4x.java.api.messages.PlcSubscriptionResponse;
import org.apache.plc4x.java.api.model.PlcConsumerRegistration;
import org.apache.plc4x.java.api.model.PlcSubscriptionHandle;
import org.apache.plc4x.java.api.types.PlcResponseCode;

import org.apache.seatunnel.plc4x.bridge.model.SubscribeRequest;
import org.apache.seatunnel.plc4x.bridge.model.PlcTagDefinition;
import org.apache.seatunnel.plc4x.bridge.sink.JdbcSink;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class Plc4xSubscribeService {

    private static final Logger log = LoggerFactory.getLogger(Plc4xSubscribeService.class);

    private final Plc4xConnectionManager connectionManager;
    private final Map<String, SubscriptionEntry> subscriptions = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public Plc4xSubscribeService(Plc4xConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public String startSubscription(SubscribeRequest request) {
        String connectionId = request.getConnectionId();
        PlcConnection connection = connectionManager.getConnection(connectionId);

        String subscriptionId = "sub-" + idGenerator.incrementAndGet();

        try {
            org.apache.plc4x.java.api.messages.PlcSubscriptionRequest.Builder builder =
                    connection.subscriptionRequestBuilder();
            for (PlcTagDefinition tag : request.getTags()) {
                builder.addChangeOfStateTagAddress(tag.getTagName(), tag.getTagAddress());
            }
            org.apache.plc4x.java.api.messages.PlcSubscriptionRequest subRequest = builder.build();
            CompletableFuture<? extends PlcSubscriptionResponse> future =
                    subRequest.execute().toCompletableFuture();
            PlcSubscriptionResponse response = future.get(10, TimeUnit.SECONDS);

            List<PlcConsumerRegistration> registrations = new ArrayList<>();
            for (String subTagName : response.getTagNames()) {
                PlcSubscriptionHandle handle = response.getSubscriptionHandle(subTagName);
                PlcConsumerRegistration registration = handle.register(event -> {
                    onPlcValue(subscriptionId, subTagName, event);
                });
                registrations.add(registration);
            }

            JdbcSink sink = buildSink(request);

            long startTime = Instant.now().toEpochMilli();
            subscriptions.put(subscriptionId, new SubscriptionEntry(
                    subscriptionId, connectionId, registrations, sink, startTime,
                    request.getBatchSize(), request.getBatchIntervalMs()));

            log.info("Subscription started: {} with {} tags", subscriptionId, request.getTags().size());
            return subscriptionId;

        } catch (Exception e) {
            throw new RuntimeException("Failed to start subscription: " + connectionId, e);
        }
    }

    public void stopSubscription(String subscriptionId) {
        SubscriptionEntry entry = subscriptions.remove(subscriptionId);
        if (entry != null) {
            for (PlcConsumerRegistration registration : entry.registrations) {
                try {
                    registration.unregister();
                } catch (Exception e) {
                    log.warn("Error unregistering for sub {}", subscriptionId, e);
                }
            }
            log.info("Subscription stopped: {}", subscriptionId);
        }
    }

    public List<Map<String, Object>> listSubscriptions() {
        List<Map<String, Object>> result = new ArrayList<>();
        long now = Instant.now().toEpochMilli();
        for (SubscriptionEntry entry : subscriptions.values()) {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("subscriptionId", entry.subscriptionId);
            info.put("connectionId", entry.connectionId);
            info.put("runningTimeMs", now - entry.startTime);
            info.put("batchSize", entry.batchSize);
            result.add(info);
        }
        return result;
    }

    private void onPlcValue(String subscriptionId, String tagName, PlcSubscriptionEvent event) {
        SubscriptionEntry entry = subscriptions.get(subscriptionId);
        if (entry == null) return;
        Object value = null;
        try {
            if (event.getResponseCode(tagName) == PlcResponseCode.OK) {
                value = event.getObject(tagName);
            }
        } catch (Exception e) {
            value = "ERROR:" + e.getMessage();
        }
        entry.buffer.add(new Object[]{tagName, value, Instant.now().toEpochMilli()});
        if (entry.buffer.size() >= entry.batchSize) {
            flushBuffer(entry);
        }
    }

    private void flushBuffer(SubscriptionEntry entry) {
        List<Object[]> batch;
        synchronized (entry.buffer) {
            if (entry.buffer.isEmpty()) return;
            batch = new ArrayList<>(entry.buffer);
            entry.buffer.clear();
        }
        try {
            entry.sink.write(batch);
        } catch (Exception e) {
            log.error("Error flushing buffer for sub {}", entry.subscriptionId, e);
        }
    }

    private JdbcSink buildSink(SubscribeRequest request) {
        if (!"JDBC".equalsIgnoreCase(request.getSinkType())) {
            throw new RuntimeException("Unsupported sink type: " + request.getSinkType());
        }
        Map<String, String> config = request.getSinkConfig();
        return new JdbcSink(
                config.get("url"),
                config.get("user"),
                config.get("password"),
                config.get("table")
        );
    }

    private static class SubscriptionEntry {
        final String subscriptionId;
        final String connectionId;
        final List<PlcConsumerRegistration> registrations;
        final JdbcSink sink;
        final long startTime;
        final int batchSize;
        final long batchIntervalMs;
        final List<Object[]> buffer = new ArrayList<>();

        SubscriptionEntry(String subscriptionId, String connectionId,
                          List<PlcConsumerRegistration> registrations, JdbcSink sink,
                          long startTime, int batchSize, long batchIntervalMs) {
            this.subscriptionId = subscriptionId;
            this.connectionId = connectionId;
            this.registrations = registrations;
            this.sink = sink;
            this.startTime = startTime;
            this.batchSize = batchSize;
            this.batchIntervalMs = batchIntervalMs;
        }
    }
}
