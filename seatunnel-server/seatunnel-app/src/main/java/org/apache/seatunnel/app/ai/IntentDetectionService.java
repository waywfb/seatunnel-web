package org.apache.seatunnel.app.ai;

import org.apache.seatunnel.app.config.AiConfig;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class IntentDetectionService {

    private static final Logger log = LoggerFactory.getLogger(IntentDetectionService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AiConfig aiConfig;
    private final RestTemplate restTemplate;

    public IntentDetectionService(AiConfig aiConfig) {
        this.aiConfig = aiConfig;
        this.restTemplate = new RestTemplate();
        this.restTemplate.setRequestFactory(
                new org.springframework.http.client.SimpleClientHttpRequestFactory());
    }

    public IntentResult detect(List<Map<String, String>> messages) {
        String systemPrompt = buildSystemPrompt();
        List<Map<String, String>> fullMessages = new ArrayList<>();
        fullMessages.add(Map.of("role", "system", "content", systemPrompt));
        fullMessages.addAll(messages);

        try {
            ObjectNode requestBody = MAPPER.createObjectNode();
            requestBody.put("model", aiConfig.getModel());
            requestBody.put("stream", false);

            ArrayNode msgArray = requestBody.putArray("messages");
            for (Map<String, String> msg : fullMessages) {
                ObjectNode m = msgArray.addObject();
                m.put("role", msg.get("role"));
                m.put("content", msg.get("content"));
            }

            ArrayNode toolsArray = requestBody.putArray("tools");
            for (ToolDefinition tool : ToolDefinitions.getAll()) {
                ObjectNode t = toolsArray.addObject();
                t.put("type", "function");
                ObjectNode func = t.putObject("function");
                func.put("name", tool.getName());
                func.put("description", tool.getDescription());
                ObjectNode params = func.putObject("parameters");
                params.put("type", tool.getParameters().get("type").toString());
                if (tool.getParameters().containsKey("properties")) {
                    params.set(
                            "properties",
                            MAPPER.valueToTree(tool.getParameters().get("properties")));
                }
                if (tool.getRequired() != null && !tool.getRequired().isEmpty()) {
                    ArrayNode req = params.putArray("required");
                    for (String r : tool.getRequired()) {
                        req.add(r);
                    }
                }
            }

            String json = MAPPER.writeValueAsString(requestBody);
            log.debug("Ollama request: {}", json);

            String response =
                    restTemplate.postForObject(
                            aiConfig.getBaseUrl() + "/api/chat", requestBody, String.class);

            log.debug("Ollama response: {}", response);

            return parseResponse(response);

        } catch (Exception e) {
            log.error("Intent detection failed", e);
            return new IntentResult("chat", Map.of("content", "抱歉，AI 服务暂时不可用，请稍后重试。"), null);
        }
    }

    private String buildSystemPrompt() {
        return "你是平台的智能助手，帮助用户管理数据集成平台。"
                + "你可以使用的工具包括：创建数据源连接、测试连接、浏览资源、列出数据源、创建和启动同步任务等。"
                + "规则：\n"
                + "1. 如果用户明确要求执行某项操作（如创建、测试、列出），使用对应的工具。\n"
                + "2. 如果用户只是提问（如「有多少数据源」「有哪些数据源」「列表」），优先直接回答，必要时使用 list_datasources 工具获取数据。\n"
                + "3. ask_clarification 仅当用户意图不明确时使用，如用户说「帮我连接一下」但未指定类型。不要对简单问题反复确认。\n"
                + "4. 用户的问题能直接回答的，不要反问。";
    }

    private IntentResult parseResponse(String response) {
        try {
            JsonNode root = MAPPER.readTree(response);
            JsonNode message = root.get("message");

            if (message == null) {
                return fallbackChat("抱歉，AI 返回了空响应。");
            }

            String role = message.get("role").asText();
            JsonNode toolCalls = message.get("tool_calls");

            if (toolCalls != null && toolCalls.isArray() && toolCalls.size() > 0) {
                JsonNode firstCall = toolCalls.get(0);
                JsonNode function = firstCall.get("function");
                String name = function.get("name").asText();
                JsonNode argsNode = function.get("arguments");
                String args =
                        argsNode.isTextual()
                                ? argsNode.asText()
                                : MAPPER.writeValueAsString(argsNode);

                if ("ask_clarification".equals(name)) {
                    JsonNode clarificationArgs = MAPPER.readTree(args);
                    return new IntentResult(
                            "clarification",
                            Map.of("question", clarificationArgs.get("question").asText()),
                            null);
                }

                return new IntentResult("tool_call", Map.of("name", name, "arguments", args), null);
            }

            String content = message.has("content") ? message.get("content").asText() : "";
            return new IntentResult("chat", Map.of("content", content), null);

        } catch (Exception e) {
            log.error("Parse Ollama response failed", e);
            return new IntentResult("chat", Map.of("content", "抱歉，解析 AI 响应时出错。"), null);
        }
    }

    private IntentResult fallbackChat(String content) {
        return new IntentResult("chat", Map.of("content", content), null);
    }

    public static class IntentResult {
        private final String type;
        private final Map<String, Object> data;
        private final String error;

        public IntentResult(String type, Map<String, Object> data, String error) {
            this.type = type;
            this.data = data;
            this.error = error;
        }

        public String getType() {
            return type;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public String getError() {
            return error;
        }

        public boolean isToolCall() {
            return "tool_call".equals(type);
        }

        public boolean isClarification() {
            return "clarification".equals(type);
        }
    }
}
