package org.apache.seatunnel.app.ai;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class ToolDefinitions {

    private static final List<ToolDefinition> TOOLS = build();

    private static List<ToolDefinition> build() {
        List<ToolDefinition> tools = new ArrayList<>();

        tools.add(
                new ToolDefinition(
                        "create_connection",
                        "创建数据源连接，例如 MySQL、Kafka、MQTT、Elasticsearch 等",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "pluginName",
                                                Map.of(
                                                        "type",
                                                        "string",
                                                        "description",
                                                        "数据源类型，如 MQTT、MySQL、Kafka、Elasticsearch"),
                                        "datasourceName",
                                                Map.of(
                                                        "type",
                                                        "string",
                                                        "description",
                                                        "连接名称，用户可自定义"),
                                        "config",
                                                Map.of(
                                                        "type",
                                                        "object",
                                                        "description",
                                                        "连接参数，如 broker、port、username、password 等"))),
                        List.of("pluginName", "datasourceName", "config")));

        tools.add(
                new ToolDefinition(
                        "test_connection",
                        "测试已有数据源连接是否可用",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "datasourceId",
                                        Map.of("type", "string", "description", "数据源 ID"))),
                        List.of("datasourceId")));

        tools.add(
                new ToolDefinition(
                        "browse_resource",
                        "浏览数据源下的资源列表，如数据库、表、Topic 等",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "datasourceId",
                                        Map.of("type", "string", "description", "数据源 ID"))),
                        List.of("datasourceId")));

        tools.add(
                new ToolDefinition(
                        "create_pipeline",
                        "创建同步任务（Pipeline），指定源和目标数据源",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "name", Map.of("type", "string", "description", "任务名称"),
                                        "sourceId",
                                                Map.of("type", "string", "description", "源数据源 ID"),
                                        "sinkId",
                                                Map.of("type", "string", "description", "目标数据源 ID"),
                                        "sourceTable",
                                                Map.of("type", "string", "description", "源表名（可选）"),
                                        "sinkTable",
                                                Map.of(
                                                        "type",
                                                        "string",
                                                        "description",
                                                        "目标表名（可选）"))),
                        List.of("name", "sourceId", "sinkId")));

        tools.add(
                new ToolDefinition(
                        "start_pipeline",
                        "启动已创建的同步任务",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "jobDefineId",
                                        Map.of("type", "string", "description", "任务定义 ID"))),
                        List.of("jobDefineId")));

        tools.add(
                new ToolDefinition(
                        "ask_clarification",
                        "当用户提供的参数不够完整时，向用户反问确认缺少的参数",
                        Map.of(
                                "type",
                                "object",
                                "properties",
                                Map.of(
                                        "question",
                                                Map.of("type", "string", "description", "向用户提问的内容"),
                                        "missingParams",
                                                Map.of(
                                                        "type",
                                                        "array",
                                                        "items",
                                                        Map.of("type", "string"),
                                                        "description",
                                                        "缺少的参数列表"))),
                        List.of("question", "missingParams")));

        return Collections.unmodifiableList(tools);
    }

    public static List<ToolDefinition> getAll() {
        return TOOLS;
    }
}
