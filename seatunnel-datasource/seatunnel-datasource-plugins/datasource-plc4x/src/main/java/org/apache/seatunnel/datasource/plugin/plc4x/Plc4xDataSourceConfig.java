package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginInfo;
import org.apache.seatunnel.datasource.plugin.api.DatasourcePluginTypeEnum;

import java.util.Map;

public class Plc4xDataSourceConfig {

    public static final String PLUGIN_NAME = "Plc4x";

    public static final DataSourcePluginInfo PLC4X_DATASOURCE_PLUGIN_INFO =
            DataSourcePluginInfo.builder()
                    .name(PLUGIN_NAME)
                    .icon("Plc4x")
                    .version("1.0.0")
                    .type(DatasourcePluginTypeEnum.REMOTE_CONNECTION.getCode())
                    .supportVirtualTables(false)
                    .build();

    public static final String BRIDGE_URL = "bridgeUrl";
    public static final String PROTOCOL = "protocol";
    public static final String HOST = "host";
    public static final String PORT = "port";
    public static final String CONNECT_TIMEOUT = "connectTimeout";
    public static final String READ_TIMEOUT = "readTimeout";

    public static final String DEFAULT_BRIDGE_URL = "http://localhost:8081";
    public static final int DEFAULT_CONNECT_TIMEOUT = 5000;
    public static final int DEFAULT_READ_TIMEOUT = 30000;

    public static final Map<String, Integer> PROTOCOL_DEFAULT_PORTS = Map.of(
            "S7", 102,
            "Modbus", 502,
            "OPC UA", 4840
    );
}
