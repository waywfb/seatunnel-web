package org.apache.seatunnel.datasource.plugin.plc4x.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class Plc4xBridgeClient {

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final OkHttpClient client;
    private final String baseUrl;

    public Plc4xBridgeClient(String bridgeUrl) {
        this.baseUrl = bridgeUrl.endsWith("/") ? bridgeUrl.substring(0, bridgeUrl.length() - 1) : bridgeUrl;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    public boolean testConnection(String protocol, String host, int port) {
        try {
            String json = MAPPER.writeValueAsString(Map.of(
                    "protocol", protocol,
                    "host", host,
                    "port", port
            ));
            RequestBody body = RequestBody.create(JSON, json);
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/connect")
                    .post(body)
                    .build();
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) return false;
                JsonNode node = MAPPER.readTree(response.body().string());
                return node.get("code").asInt() == 200;
            }
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> listDatabases(String connectionId) {
        return doGetList("/api/databases?connectionId=" + connectionId);
    }

    public List<String> listTables(String connectionId) {
        return doGetList("/api/tables?connectionId=" + connectionId);
    }

    public Map<String, List<String>> getFields(String connectionId, String groupName) {
        try {
            String url = baseUrl + "/api/fields?connectionId=" + connectionId;
            if (groupName != null) {
                url += "&groupName=" + groupName;
            }
            Request request = new Request.Builder().url(url).get().build();
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) return Collections.emptyMap();
                JsonNode node = MAPPER.readTree(response.body().string());
                return Collections.emptyMap();
            }
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> doGetList(String path) {
        try {
            Request request = new Request.Builder().url(baseUrl + path).get().build();
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) return Collections.emptyList();
                JsonNode node = MAPPER.readTree(response.body().string());
                if (node.get("code").asInt() != 200) return Collections.emptyList();
                JsonNode data = node.get("data");
                if (data == null || !data.isArray()) return Collections.emptyList();
                return MAPPER.convertValue(data, List.class);
            }
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
