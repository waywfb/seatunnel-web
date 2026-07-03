package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.datasource.plugin.api.DataSourceChannel;
import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginException;
import org.apache.seatunnel.datasource.plugin.api.model.TableField;
import org.apache.seatunnel.datasource.plugin.plc4x.client.Plc4xBridgeClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class Plc4xDataSourceChannel implements DataSourceChannel {

    @Override
    public OptionRule getDataSourceOptions(String pluginName) {
        return Plc4xOptionRule.optionRule();
    }

    @Override
    public OptionRule getDatasourceMetadataFieldsByDataSourceName(String pluginName) {
        return Plc4xOptionRule.metadataRule();
    }

    @Override
    public List<String> getTables(String pluginName, Map<String, String> requestParams,
                                  String database, Map<String, String> options) {
        Plc4xBridgeClient client = buildClient(requestParams);
        return client.listTables(resolveConnectionId(requestParams));
    }

    @Override
    public List<String> getDatabases(String pluginName, Map<String, String> requestParams) {
        Plc4xBridgeClient client = buildClient(requestParams);
        return client.listDatabases(resolveConnectionId(requestParams));
    }

    @Override
    public boolean checkDataSourceConnectivity(String pluginName,
                                               Map<String, String> requestParams) {
        String bridgeUrl = requestParams.get(Plc4xDataSourceConfig.BRIDGE_URL);
        String protocol = requestParams.get(Plc4xDataSourceConfig.PROTOCOL);
        String host = requestParams.get(Plc4xDataSourceConfig.HOST);
        String portStr = requestParams.get(Plc4xDataSourceConfig.PORT);
        if (bridgeUrl == null || protocol == null || host == null || portStr == null) {
            throw new DataSourcePluginException("bridgeUrl, protocol, host, port are required");
        }
        Plc4xBridgeClient client = new Plc4xBridgeClient(bridgeUrl);
        return client.testConnection(protocol, host, Integer.parseInt(portStr));
    }

    @Override
    public List<TableField> getTableFields(String pluginName,
                                           Map<String, String> requestParams,
                                           String database, String table) {
        return Collections.emptyList();
    }

    private Plc4xBridgeClient buildClient(Map<String, String> params) {
        String bridgeUrl = params.get(Plc4xDataSourceConfig.BRIDGE_URL);
        if (bridgeUrl == null) {
            bridgeUrl = Plc4xDataSourceConfig.DEFAULT_BRIDGE_URL;
        }
        return new Plc4xBridgeClient(bridgeUrl);
    }

    private String resolveConnectionId(Map<String, String> params) {
        String protocol = params.get(Plc4xDataSourceConfig.PROTOCOL);
        String host = params.get(Plc4xDataSourceConfig.HOST);
        String port = params.get(Plc4xDataSourceConfig.PORT);
        return protocol + "://" + host + ":" + port;
    }
}
