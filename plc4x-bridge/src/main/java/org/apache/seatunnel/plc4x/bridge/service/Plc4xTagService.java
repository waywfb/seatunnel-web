package org.apache.seatunnel.plc4x.bridge.service;

import org.apache.plc4x.java.api.PlcConnection;
import org.apache.plc4x.java.api.exceptions.PlcUnsupportedOperationException;
import org.apache.plc4x.java.api.messages.PlcBrowseRequest;
import org.apache.plc4x.java.api.messages.PlcBrowseResponse;
import org.apache.plc4x.java.api.messages.PlcReadRequest;
import org.apache.plc4x.java.api.messages.PlcReadResponse;
import org.apache.plc4x.java.api.messages.PlcBrowseItem;
import org.apache.plc4x.java.api.types.PlcResponseCode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class Plc4xTagService {

    private static final Logger log = LoggerFactory.getLogger(Plc4xTagService.class);
    private static final long READ_TIMEOUT_MS = 10_000;

    private final Plc4xConnectionManager connectionManager;

    public Plc4xTagService(Plc4xConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public List<Map<String, Object>> browseTags(String connectionId) {
        PlcConnection connection = connectionManager.getConnection(connectionId);
        try {
            PlcBrowseRequest request = connection.browseRequestBuilder().build();
            CompletableFuture<? extends PlcBrowseResponse> future = request.execute().toCompletableFuture();
            PlcBrowseResponse response = future.get(READ_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            List<Map<String, Object>> groups = new ArrayList<>();
            for (String queryName : response.getQueryNames()) {
                Map<String, Object> group = new LinkedHashMap<>();
                group.put("groupName", queryName);
                List<Map<String, Object>> tags = new ArrayList<>();
                for (PlcBrowseItem item : response.getValues(queryName)) {
                    Map<String, Object> tag = new LinkedHashMap<>();
                    tag.put("tagAddress", item.getTag().getAddressString());
                    tag.put("tagName", item.getName());
                    tag.put("dataType", item.getTag().getClass().getSimpleName());
                    tags.add(tag);
                }
                group.put("tags", tags);
                groups.add(group);
            }
            return groups;
        } catch (PlcUnsupportedOperationException e) {
            log.warn("Browse not supported for connection: {}", connectionId);
            return Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to browse tags: " + connectionId, e);
        }
    }

    public Map<String, Object> readTags(String connectionId, List<String> tagAddresses) {
        PlcConnection connection = connectionManager.getConnection(connectionId);
        try {
            PlcReadRequest.Builder builder = connection.readRequestBuilder();
            for (int i = 0; i < tagAddresses.size(); i++) {
                builder.addTagAddress(String.valueOf(i), tagAddresses.get(i));
            }
            PlcReadRequest request = builder.build();
            CompletableFuture<? extends PlcReadResponse> future = request.execute().toCompletableFuture();
            PlcReadResponse response = future.get(READ_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            Map<String, Object> result = new LinkedHashMap<>();
            for (int i = 0; i < tagAddresses.size(); i++) {
                String address = tagAddresses.get(i);
                PlcResponseCode code = response.getResponseCode(String.valueOf(i));
                if (code == PlcResponseCode.OK) {
                    result.put(address, response.getObject(String.valueOf(i)));
                } else {
                    result.put(address, "ERROR:" + code);
                }
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read tags: " + connectionId, e);
        }
    }
}
