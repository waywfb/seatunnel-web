package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

public class Plc4xOptionRule {

    public static OptionRule optionRule(String pluginName) {
        String protocol = Plc4xDataSourceConfig.PLUGIN_TO_PROTOCOL.get(pluginName);
        int defaultPort =
                protocol != null
                        ? Plc4xDataSourceConfig.PROTOCOL_DEFAULT_PORTS.getOrDefault(protocol, 0)
                        : 0;

        OptionRule.Builder builder =
                OptionRule.builder()
                        .required(
                                Options.key(Plc4xDataSourceConfig.HOST)
                                        .stringType()
                                        .noDefaultValue()
                                        .withDescription("PLC host address"),
                                Options.key(Plc4xDataSourceConfig.PORT)
                                        .intType()
                                        .defaultValue(defaultPort)
                                        .withDescription("PLC port"));

        if (Plc4xDataSourceConfig.MODBUS_PROTOCOL.equals(protocol)) {
            builder.required(
                    Options.key(Plc4xDataSourceConfig.UNIT_ID)
                            .intType()
                            .defaultValue(Plc4xDataSourceConfig.DEFAULT_UNIT_ID)
                            .withDescription("Modbus unit identifier (slave ID)"));
        } else if (Plc4xDataSourceConfig.OPCUA_PROTOCOL.equals(protocol)) {
            builder.required(
                    Options.key(Plc4xDataSourceConfig.SECURITY_POLICY)
                            .enumType(OpcUaSecurityPolicy.class)
                            .defaultValue(OpcUaSecurityPolicy.None)
                            .withDescription("OPC UA security policy"));
            builder.optional(
                    Options.key(Plc4xDataSourceConfig.USERNAME)
                            .stringType()
                            .noDefaultValue()
                            .withDescription("OPC UA username"),
                    Options.key(Plc4xDataSourceConfig.PASSWORD)
                            .stringType()
                            .noDefaultValue()
                            .withDescription("OPC UA password"));
        } else if (Plc4xDataSourceConfig.S7_PROTOCOL.equals(protocol)) {
            builder.required(
                    Options.key(Plc4xDataSourceConfig.RACK)
                            .intType()
                            .defaultValue(Plc4xDataSourceConfig.DEFAULT_RACK)
                            .withDescription("S7 rack number"),
                    Options.key(Plc4xDataSourceConfig.SLOT)
                            .intType()
                            .defaultValue(Plc4xDataSourceConfig.DEFAULT_SLOT)
                            .withDescription("S7 slot number"));
            builder.optional(
                    Options.key(Plc4xDataSourceConfig.LOCAL_TSAP)
                            .stringType()
                            .noDefaultValue()
                            .withDescription("S7 local TSAP"),
                    Options.key(Plc4xDataSourceConfig.REMOTE_TSAP)
                            .stringType()
                            .noDefaultValue()
                            .withDescription("S7 remote TSAP"));
        }

        return builder.optional(
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

    public enum OpcUaSecurityPolicy {
        None("None"),
        Basic128Rsa15("Basic128Rsa15"),
        Basic256("Basic256"),
        Basic256Sha256("Basic256Sha256");

        private final String policy;

        OpcUaSecurityPolicy(String policy) {
            this.policy = policy;
        }

        @Override
        public String toString() {
            return policy;
        }
    }
}
