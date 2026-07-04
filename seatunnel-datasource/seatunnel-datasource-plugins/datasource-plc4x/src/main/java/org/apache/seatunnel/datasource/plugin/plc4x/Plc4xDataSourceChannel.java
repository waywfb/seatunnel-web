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
        return Plc4xOptionRule.optionRule(pluginName);
    }

    @Override
    public OptionRule getDatasourceMetadataFieldsByDataSourceName(String pluginName) {
        return Plc4xOptionRule.metadataRule();
    }

    @Override
    public List<String> getTables(String pluginName, Map<String, String> requestParams,
                                  String database, Map<String, String> options) {
        Plc4xBridgeClient client = buildClient(requestParams);
        return client.listTables(resolveConnectionId(pluginName, requestParams));
    }

    @Override
    public List<String> getDatabases(String pluginName, Map<String, String> requestParams) {
        Plc4xBridgeClient client = buildClient(requestParams);
        return client.listDatabases(resolveConnectionId(pluginName, requestParams));
    }

    @Override
    public boolean checkDataSourceConnectivity(String pluginName,
                                               Map<String, String> requestParams) {
        String bridgeUrl = Plc4xDataSourceConfig.getBridgeUrl();
        String protocol = resolveProtocol(pluginName);
        String host = requestParams.get(Plc4xDataSourceConfig.HOST);
        String portStr = requestParams.get(Plc4xDataSourceConfig.PORT);
        if (host == null || portStr == null) {
            throw new DataSourcePluginException("host, port are required");
        }
        Map<String, String> bridgeParams = new java.util.HashMap<>();
        if (Plc4xDataSourceConfig.MODBUS_PROTOCOL.equals(protocol)) {
            String unitId = requestParams.get(Plc4xDataSourceConfig.UNIT_ID);
            if (unitId != null) bridgeParams.put("unitId", unitId);
        } else if (Plc4xDataSourceConfig.OPCUA_PROTOCOL.equals(protocol)) {
            String securityPolicy = requestParams.get(Plc4xDataSourceConfig.SECURITY_POLICY);
            String username = requestParams.get(Plc4xDataSourceConfig.USERNAME);
            String password = requestParams.get(Plc4xDataSourceConfig.PASSWORD);
            if (securityPolicy != null) bridgeParams.put("securityPolicy", securityPolicy);
            if (username != null) bridgeParams.put("username", username);
            if (password != null) bridgeParams.put("password", password);
        } else if (Plc4xDataSourceConfig.S7_PROTOCOL.equals(protocol)) {
            String rack = requestParams.get(Plc4xDataSourceConfig.RACK);
            String slot = requestParams.get(Plc4xDataSourceConfig.SLOT);
            String localTSAP = requestParams.get(Plc4xDataSourceConfig.LOCAL_TSAP);
            String remoteTSAP = requestParams.get(Plc4xDataSourceConfig.REMOTE_TSAP);
            if (rack != null) bridgeParams.put("rack", rack);
            if (slot != null) bridgeParams.put("slot", slot);
            if (localTSAP != null) bridgeParams.put("localTSAP", localTSAP);
            if (remoteTSAP != null) bridgeParams.put("remoteTSAP", remoteTSAP);
        }
        Plc4xBridgeClient client = new Plc4xBridgeClient(bridgeUrl);
        return client.testConnection(protocol, host, Integer.parseInt(portStr), bridgeParams);
    }

    @Override
    public List<TableField> getTableFields(String pluginName,
                                           Map<String, String> requestParams,
                                           String database, String table) {
        return Collections.emptyList();
    }

    private Plc4xBridgeClient buildClient(Map<String, String> params) {
        return new Plc4xBridgeClient(Plc4xDataSourceConfig.getBridgeUrl());
    }

    private String resolveConnectionId(String pluginName, Map<String, String> params) {
        String protocol = resolveProtocol(pluginName);
        String host = params.get(Plc4xDataSourceConfig.HOST);
        String port = params.get(Plc4xDataSourceConfig.PORT);
        return protocol + "://" + host + ":" + port;
    }

    private String resolveProtocol(String pluginName) {
        String protocol = Plc4xDataSourceConfig.PLUGIN_TO_PROTOCOL.get(pluginName);
        if (protocol == null) {
            throw new DataSourcePluginException("Unknown plugin name: " + pluginName);
        }
        return protocol;
    }
}
