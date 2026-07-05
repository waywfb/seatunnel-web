package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginInfo;
import org.apache.seatunnel.datasource.plugin.api.DatasourcePluginTypeEnum;

import java.util.Map;

public class Plc4xDataSourceConfig {

    public static final String PLUGIN_NAME = "Plc4x";

    public static final DataSourcePluginInfo MODBUS_DATASOURCE_PLUGIN_INFO =
            DataSourcePluginInfo.builder()
                    .name("Modbus")
                    .icon("Modbus")
                    .version("1.0.0")
                    .type(DatasourcePluginTypeEnum.REMOTE_CONNECTION.getCode())
                    .supportVirtualTables(false)
                    .build();

    public static final DataSourcePluginInfo OPCUA_DATASOURCE_PLUGIN_INFO =
            DataSourcePluginInfo.builder()
                    .name("OPCUA")
                    .icon("OPCUA")
                    .version("1.0.0")
                    .type(DatasourcePluginTypeEnum.REMOTE_CONNECTION.getCode())
                    .supportVirtualTables(false)
                    .build();

    public static final DataSourcePluginInfo S7_DATASOURCE_PLUGIN_INFO =
            DataSourcePluginInfo.builder()
                    .name("S7")
                    .icon("S7")
                    .version("1.0.0")
                    .type(DatasourcePluginTypeEnum.REMOTE_CONNECTION.getCode())
                    .supportVirtualTables(false)
                    .build();

    public static final String HOST = "host";
    public static final String PORT = "port";
    public static final String CONNECT_TIMEOUT = "connectTimeout";
    public static final String READ_TIMEOUT = "readTimeout";

    public static final String UNIT_ID = "unitId";
    public static final String RACK = "rack";
    public static final String SLOT = "slot";
    public static final String LOCAL_TSAP = "localTSAP";
    public static final String REMOTE_TSAP = "remoteTSAP";
    public static final String SECURITY_POLICY = "securityPolicy";
    public static final String USERNAME = "username";
    public static final String PASSWORD = "password";

    public static final String BRIDGE_URL_CONFIG_KEY = "plc4x.bridge.url";
    public static final String DEFAULT_BRIDGE_URL = "http://localhost:8081";

    public static String getBridgeUrl() {
        return System.getProperty(BRIDGE_URL_CONFIG_KEY, DEFAULT_BRIDGE_URL);
    }

    public static final int DEFAULT_CONNECT_TIMEOUT = 5000;
    public static final int DEFAULT_READ_TIMEOUT = 30000;
    public static final int DEFAULT_UNIT_ID = 1;
    public static final int DEFAULT_RACK = 0;
    public static final int DEFAULT_SLOT = 2;

    public static final String MODBUS_PROTOCOL = "Modbus";
    public static final String OPCUA_PROTOCOL = "OPC UA";
    public static final String S7_PROTOCOL = "S7";

    public static final Map<String, String> PLUGIN_TO_PROTOCOL =
            Map.of(
                    "Modbus", MODBUS_PROTOCOL,
                    "OPCUA", OPCUA_PROTOCOL,
                    "S7", S7_PROTOCOL);

    public static final Map<String, Integer> PROTOCOL_DEFAULT_PORTS =
            Map.of(
                    S7_PROTOCOL, 102,
                    MODBUS_PROTOCOL, 502,
                    OPCUA_PROTOCOL, 4840);
}
