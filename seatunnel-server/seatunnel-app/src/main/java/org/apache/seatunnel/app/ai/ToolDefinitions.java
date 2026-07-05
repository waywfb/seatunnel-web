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
                        "创建数据源连接，例如 MySQL、Kafka、MQTT、Elasticsearch、OPCUA、Modbus、S7 等",
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
                                                        "数据源类型，可选值: MQTT、MySQL、Kafka、Elasticsearch、OPCUA、Modbus、S7"),
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
                                                        "连接参数。不同数据源类型需要不同参数：\n"
                                                                + "OPCUA: host(主机地址), port(端口,默认4840), securityPolicy(安全策略,可选None/Basic128Rsa15/Basic256/Basic256Sha256,默认None), username(用户名,可选), password(密码,可选), connectTimeout(连接超时毫秒,默认5000), readTimeout(读取超时毫秒,默认30000)\n"
                                                                + "Modbus: host, port(默认502), unitId(单元ID,默认1)\n"
                                                                + "S7: host, port(默认102), rack(默认0), slot(默认2)\n"
                                                                + "MySQL: host, port(默认3306), database, username, password\n"
                                                                + "Kafka: bootstrapServers, topic\n"
                                                                + "MQTT: broker, port(默认1883), clientId, topic\n"
                                                                + "Elasticsearch: hosts(逗号分隔的地址列表), index"))),
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
