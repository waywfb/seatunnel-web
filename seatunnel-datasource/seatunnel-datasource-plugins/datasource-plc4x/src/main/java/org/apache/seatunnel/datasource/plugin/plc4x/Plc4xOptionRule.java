package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

public class Plc4xOptionRule {

    public static OptionRule optionRule(String pluginName) {
        String protocol = Plc4xDataSourceConfig.PLUGIN_TO_PROTOCOL.get(pluginName);
        int defaultPort = protocol != null
                ? Plc4xDataSourceConfig.PROTOCOL_DEFAULT_PORTS.getOrDefault(protocol, 0)
                : 0;
        return OptionRule.builder()
                .required(
                        Options.key(Plc4xDataSourceConfig.BRIDGE_URL)
                                .stringType()
                                .defaultValue(Plc4xDataSourceConfig.DEFAULT_BRIDGE_URL)
                                .withDescription("PLC4X bridge service URL"),
                        Options.key(Plc4xDataSourceConfig.HOST)
                                .stringType()
                                .noDefaultValue()
                                .withDescription("PLC host address"),
                        Options.key(Plc4xDataSourceConfig.PORT)
                                .intType()
                                .defaultValue(defaultPort)
                                .withDescription("PLC port"))
                .optional(
                        Options.key(Plc4xDataSourceConfig.CONNECT_TIMEOUT)
                                .intType()
                                .defaultValue(Plc4xDataSourceConfig.DEFAULT_CONNECT_TIMEOUT)
                                .withDescription("Connection timeout in milliseconds"),
                        Options.key(Plc4xDataSourceConfig.READ_TIMEOUT)
                                .intType()
                                .defaultValue(Plc4xDataSourceConfig.DEFAULT_READ_TIMEOUT)
                                .withDescription("Read timeout in milliseconds"))
                .build();
    }

    public static OptionRule metadataRule() {
        return OptionRule.builder().build();
    }
}
