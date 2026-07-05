package org.apache.seatunnel.datasource.plugin.plc4x.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class Plc4xBridgeClient {

    private static final Logger LOG = LoggerFactory.getLogger(Plc4xBridgeClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String baseUrl;
    private final int connectTimeout;
    private final int readTimeout;

    public Plc4xBridgeClient(String bridgeUrl) {
        this.baseUrl =
                bridgeUrl.endsWith("/")
                        ? bridgeUrl.substring(0, bridgeUrl.length() - 1)
                        : bridgeUrl;
        this.connectTimeout = 5000;
        this.readTimeout = 30000;
        LOG.info("Plc4xBridgeClient created, baseUrl={}", this.baseUrl);
    }

    public boolean testConnection(
            String protocol, String host, int port, Map<String, String> params) {
        try {
            Map<String, Object> bodyMap = new java.util.LinkedHashMap<>();
            bodyMap.put("protocol", protocol);
            bodyMap.put("host", host);
            bodyMap.put("port", port);
            if (params != null && !params.isEmpty()) {
                bodyMap.put("params", params);
            }
            String json = MAPPER.writeValueAsString(bodyMap);
            LOG.info("Testing connection: POST {}/api/connect body={}", baseUrl, json);
            String response = doPost("/api/connect", json);
            LOG.info("Connection test response: {}", response);
            JsonNode node = MAPPER.readTree(response);
            return node.get("code").asInt() == 200;
        } catch (Exception e) {
            LOG.error("Connection test failed", e);
            return false;
        }
    }

    public List<String> listDatabases(String connectionId) {
        return doGetList("/api/databases?connectionId=" + urlEncode(connectionId));
    }

    public List<String> listTables(String connectionId) {
        return doGetList("/api/tables?connectionId=" + urlEncode(connectionId));
    }

    public List<Map<String, Object>> getFields(String connectionId, String groupName) {
        try {
            StringBuilder url =
                    new StringBuilder(
                            baseUrl + "/api/fields?connectionId=" + urlEncode(connectionId));
            if (groupName != null) {
                url.append("&groupName=").append(urlEncode(groupName));
            }
            String response = doGet(url.toString());
            JsonNode node = MAPPER.readTree(response);
            if (node.get("code").asInt() != 200) return Collections.emptyList();
            JsonNode data = node.get("data");
            if (data == null || !data.isArray()) return Collections.emptyList();
            List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (JsonNode item : data) {
                result.add(MAPPER.convertValue(item, Map.class));
            }
            return result;
        } catch (Exception e) {
            LOG.error(
                    "getFields failed for connectionId={}, groupName={}",
                    connectionId,
                    groupName,
                    e);
            return Collections.emptyList();
        }
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private List<String> doGetList(String path) {
        try {
            String response = doGet(baseUrl + path);
            JsonNode node = MAPPER.readTree(response);
            if (node.get("code").asInt() != 200) return Collections.emptyList();
            JsonNode data = node.get("data");
            if (data == null || !data.isArray()) return Collections.emptyList();
            return MAPPER.convertValue(data, List.class);
        } catch (Exception e) {
            LOG.error("doGetList failed for path={}", path, e);
            return Collections.emptyList();
        }
    }

    private String doGet(String url) throws Exception {
        HttpURLConnection conn = null;
        try {
            conn = openConnection(url);
            conn.setRequestMethod("GET");
            int code = conn.getResponseCode();
            if (code != 200) {
                String body = readErrorBody(conn);
                throw new RuntimeException("HTTP " + code + " response: " + body);
            }
            return readBody(conn);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private String doPost(String path, String json) throws Exception {
        HttpURLConnection conn = null;
        try {
            conn = openConnection(baseUrl + path);
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] data = json.getBytes(StandardCharsets.UTF_8);
            conn.setFixedLengthStreamingMode(data.length);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(data);
                os.flush();
            }
            int code = conn.getResponseCode();
            if (code != 200) {
                String body = readErrorBody(conn);
                throw new RuntimeException("HTTP " + code + " response: " + body);
            }
            return readBody(conn);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private HttpURLConnection openConnection(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(connectTimeout);
        conn.setReadTimeout(readTimeout);
        return conn;
    }

    private String readBody(HttpURLConnection conn) throws Exception {
        try (InputStream is = conn.getInputStream()) {
            return new String(readAll(is), StandardCharsets.UTF_8);
        }
    }

    private String readErrorBody(HttpURLConnection conn) {
        try (InputStream is = conn.getErrorStream()) {
            if (is != null) return new String(readAll(is), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
        }
        return "";
    }

    private byte[] readAll(InputStream is) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) != -1) {
            baos.write(buf, 0, n);
        }
        return baos.toByteArray();
    }
}
