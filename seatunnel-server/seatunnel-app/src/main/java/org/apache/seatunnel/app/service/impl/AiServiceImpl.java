package org.apache.seatunnel.app.service.impl;

import org.apache.seatunnel.app.ai.ActionExecutorService;
import org.apache.seatunnel.app.ai.IntentDetectionService;
import org.apache.seatunnel.app.ai.ToolCallResult;
import org.apache.seatunnel.app.config.AiConfig;
import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.IAiService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AiServiceImpl implements IAiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final long SSE_TIMEOUT = 5 * 60 * 1000L;

    private final AiConfig aiConfig;
    private final IntentDetectionService intentDetectionService;
    private final ActionExecutorService actionExecutorService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public AiServiceImpl(
            AiConfig aiConfig,
            IntentDetectionService intentDetectionService,
            ActionExecutorService actionExecutorService) {
        this.aiConfig = aiConfig;
        this.intentDetectionService = intentDetectionService;
        this.actionExecutorService = actionExecutorService;
    }

    @Override
    public SseEmitter chat(List<Map<String, String>> messages) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        executor.execute(() -> streamChat(messages, emitter, false, null));
        return emitter;
    }

    @Override
    public SseEmitter chatWithActions(List<Map<String, String>> messages, UserContext userContext) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        executor.execute(
                () -> {
                    if (userContext != null) {
                        UserContextHolder.setUserContext(userContext);
                    }
                    try {
                        streamChatWithActions(messages, emitter, userContext);
                    } finally {
                        UserContextHolder.clear();
                    }
                });
        return emitter;
    }

    private void streamChat(
            List<Map<String, String>> messages,
            SseEmitter emitter,
            boolean includeSystemPrompt,
            String systemPromptOverride) {
        try {
            List<Map<String, String>> fullMessages = new ArrayList<>();
            if (includeSystemPrompt) {
                String prompt =
                        systemPromptOverride != null
                                ? systemPromptOverride
                                : aiConfig.getSystemPrompt();
                fullMessages.add(Map.of("role", "system", "content", prompt));
            }
            fullMessages.addAll(messages);

            String requestBody = buildChatRequest(fullMessages, true);
            log.debug("Ollama chat request: {}", requestBody);

            URL url = new URL(aiConfig.getBaseUrl() + "/api/chat");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout((int) aiConfig.getTimeoutMs());

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                String errorBody =
                        new String(
                                conn.getErrorStream() != null
                                        ? conn.getErrorStream().readAllBytes()
                                        : new byte[0],
                                StandardCharsets.UTF_8);
                log.error("Ollama returned {}: {}", responseCode, errorBody);
                emitter.send(
                        SseEmitter.event().name("error").data("AI 服务响应异常 (" + responseCode + ")"));
                emitter.complete();
                return;
            }

            try (BufferedReader reader =
                    new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> chunk = MAPPER.readValue(line, Map.class);
                        Object done = chunk.get("done");
                        if (chunk.containsKey("message")) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> msg = (Map<String, Object>) chunk.get("message");
                            Object content = msg.get("content");
                            if (content != null) {
                                emitter.send(
                                        SseEmitter.event()
                                                .name("message")
                                                .data(content.toString()));
                            }
                        }
                        if (Boolean.TRUE.equals(done)) {
                            break;
                        }
                    } catch (Exception e) {
                        log.warn("Parse chunk failed: {}", line, e);
                    }
                }
            }

            emitter.send(SseEmitter.event().name("done").data(""));
            emitter.complete();

        } catch (Exception e) {
            log.error("SSE chat failed", e);
            try {
                emitter.send(SseEmitter.event().name("error").data("AI 服务连接失败: " + e.getMessage()));
            } catch (Exception ignored) {
            }
            emitter.completeWithError(e);
        }
    }

    private void streamChatWithActions(
            List<Map<String, String>> messages, SseEmitter emitter, UserContext userContext) {
        try {
            emitter.send(SseEmitter.event().name("message").data("🤔 正在分析您的需求...\n\n"));

            IntentDetectionService.IntentResult intent = intentDetectionService.detect(messages);

            if (intent.isClarification()) {
                String question = (String) intent.getData().get("question");
                emitter.send(SseEmitter.event().name("message").data(question));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
                return;
            }

            if (intent.isToolCall()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) intent.getData();
                String toolName = (String) data.get("name");
                String arguments = (String) data.get("arguments");

                emitter.send(
                        SseEmitter.event()
                                .name("message")
                                .data("🔧 正在执行: **" + toolName + "**\n\n"));

                ToolCallResult result = actionExecutorService.execute(toolName, arguments);

                if (result.isSuccess()) {
                    emitter.send(
                            SseEmitter.event()
                                    .name("message")
                                    .data("✅ " + result.getMessage() + "\n\n"));
                    if (result.getData() != null) {
                        String json =
                                MAPPER.writerWithDefaultPrettyPrinter()
                                        .writeValueAsString(result.getData());
                        emitter.send(
                                SseEmitter.event()
                                        .name("message")
                                        .data("```json\n" + json + "\n```\n\n"));
                    }
                } else {
                    emitter.send(
                            SseEmitter.event()
                                    .name("message")
                                    .data("❌ " + result.getMessage() + "\n\n"));
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
                return;
            }

            String content = (String) intent.getData().get("content");
            if (content != null && !content.isEmpty()) {
                emitter.send(SseEmitter.event().name("message").data(content));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
                return;
            }

            streamChat(messages, emitter, true, null);

        } catch (Exception e) {
            log.error("Chat with actions failed", e);
            streamChat(messages, emitter, true, null);
        }
    }

    private String buildChatRequest(List<Map<String, String>> messages, boolean stream) {
        try {
            com.fasterxml.jackson.databind.node.ObjectNode root = MAPPER.createObjectNode();
            root.put("model", aiConfig.getModel());
            root.put("stream", stream);

            com.fasterxml.jackson.databind.node.ArrayNode msgArray = root.putArray("messages");
            for (Map<String, String> msg : messages) {
                com.fasterxml.jackson.databind.node.ObjectNode m = msgArray.addObject();
                m.put("role", msg.get("role"));
                m.put("content", msg.get("content"));
            }

            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Build request failed", e);
        }
    }
}
