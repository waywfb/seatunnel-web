package org.apache.seatunnel.app.ai;

import org.apache.seatunnel.app.domain.response.datasource.DatasourceDetailRes;
import org.apache.seatunnel.app.service.IDatasourceService;
import org.apache.seatunnel.app.service.IJobExecutorService;
import org.apache.seatunnel.app.service.IJobService;
import org.apache.seatunnel.app.service.IJobTaskService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class ActionExecutorService {

    private static final Logger log = LoggerFactory.getLogger(ActionExecutorService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String DEFAULT_PLUGIN_VERSION = "1.0.0";

    private final IDatasourceService datasourceService;
    private final IJobService jobService;
    private final IJobTaskService jobTaskService;
    private final IJobExecutorService jobExecutorService;

    public ActionExecutorService(
            IDatasourceService datasourceService,
            IJobService jobService,
            IJobTaskService jobTaskService,
            IJobExecutorService jobExecutorService) {
        this.datasourceService = datasourceService;
        this.jobService = jobService;
        this.jobTaskService = jobTaskService;
        this.jobExecutorService = jobExecutorService;
    }

    public ToolCallResult execute(String toolName, String argumentsJson) {
        try {
            Map<String, Object> args =
                    MAPPER.readValue(argumentsJson, new TypeReference<Map<String, Object>>() {});

            switch (toolName) {
                case "create_connection":
                    return createConnection(args);
                case "test_connection":
                    return testConnection(args);
                case "browse_resource":
                    return browseResource(args);
                case "create_pipeline":
                    return createPipeline(args);
                case "start_pipeline":
                    return startPipeline(args);
                default:
                    return ToolCallResult.fail("未知工具: " + toolName);
            }
        } catch (Exception e) {
            log.error("Execute tool {} failed", toolName, e);
            return ToolCallResult.fail("执行失败: " + e.getMessage());
        }
    }

    private ToolCallResult createConnection(Map<String, Object> args) {
        String pluginName = str(args, "pluginName");
        String datasourceName = str(args, "datasourceName");
        Object configRaw = args.get("config");

        if (pluginName == null || datasourceName == null || configRaw == null) {
            return ToolCallResult.fail("参数不完整，需要 pluginName、datasourceName 和 config");
        }

        @SuppressWarnings("unchecked")
        Map<String, String> config = MAPPER.convertValue(configRaw, Map.class);

        try {
            String datasourceId =
                    datasourceService.createDatasource(
                            datasourceName, pluginName, DEFAULT_PLUGIN_VERSION, "", config);
            return ToolCallResult.ok(
                    "连接创建成功",
                    Map.of(
                            "datasourceId", datasourceId,
                            "datasourceName", datasourceName,
                            "pluginName", pluginName));
        } catch (Exception e) {
            return ToolCallResult.fail("创建连接失败: " + e.getMessage());
        }
    }

    private ToolCallResult testConnection(Map<String, Object> args) {
        String datasourceId = str(args, "datasourceId");
        if (datasourceId == null) {
            return ToolCallResult.fail("缺少 datasourceId");
        }

        try {
            DatasourceDetailRes detail = datasourceService.queryDatasourceDetailById(datasourceId);
            if (detail == null) {
                return ToolCallResult.fail("数据源不存在: " + datasourceId);
            }
            boolean ok =
                    datasourceService.testDatasourceConnectionAble(Long.parseLong(datasourceId));
            return ok ? ToolCallResult.ok("连接测试通过", detail) : ToolCallResult.fail("连接测试失败，请检查连接参数");
        } catch (Exception e) {
            return ToolCallResult.fail("连接测试异常: " + e.getMessage());
        }
    }

    private ToolCallResult browseResource(Map<String, Object> args) {
        String datasourceId = str(args, "datasourceId");
        if (datasourceId == null) {
            return ToolCallResult.fail("缺少 datasourceId");
        }

        try {
            DatasourceDetailRes detail = datasourceService.queryDatasourceDetailById(datasourceId);
            if (detail == null) {
                return ToolCallResult.fail("数据源不存在: " + datasourceId);
            }
            List<String> databases =
                    datasourceService.queryDatabaseByDatasourceName(detail.getDatasourceName());
            return ToolCallResult.ok(
                    "查询成功",
                    Map.of("datasourceName", detail.getDatasourceName(), "databases", databases));
        } catch (Exception e) {
            return ToolCallResult.fail("浏览资源失败: " + e.getMessage());
        }
    }

    private ToolCallResult createPipeline(Map<String, Object> args) {
        return ToolCallResult.fail("创建同步任务功能需要通过 UI 完成详细配置，请前往「同步中心」继续操作。");
    }

    private ToolCallResult startPipeline(Map<String, Object> args) {
        return ToolCallResult.fail("启动任务功能暂未开放，请通过 UI 操作。");
    }

    private static String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}
