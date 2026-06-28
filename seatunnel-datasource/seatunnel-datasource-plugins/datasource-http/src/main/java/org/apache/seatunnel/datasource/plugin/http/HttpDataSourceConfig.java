package org.apache.seatunnel.datasource.plugin.http;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginInfo;
import org.apache.seatunnel.datasource.plugin.api.DatasourcePluginTypeEnum;

import java.util.Map;

public class HttpDataSourceConfig {

    public static final String PLUGIN_NAME = "Http";

    public static final DataSourcePluginInfo HTTP_DATASOURCE_PLUGIN_INFO =
            DataSourcePluginInfo.builder()
                    .name(PLUGIN_NAME)
                    .icon(PLUGIN_NAME)
                    .version("1.0.0")
                    .type(DatasourcePluginTypeEnum.NO_STRUCTURED.getCode())
                    .build();

    public static final Option<String> URL =
            Options.key("url")
                    .stringType()
                    .noDefaultValue()
                    .withDescription("HTTP request URL");

    public static final Option<String> METHOD =
            Options.key("method")
                    .stringType()
                    .defaultValue("GET")
                    .withDescription("HTTP request method");

    public static final Option<Map<String, String>> HEADERS =
            Options.key("headers")
                    .mapType()
                    .noDefaultValue()
                    .withDescription("HTTP request headers");

    public static final Option<Map<String, String>> PARAMS =
            Options.key("params")
                    .mapType()
                    .noDefaultValue()
                    .withDescription("HTTP query parameters");

    public static final Option<String> BODY =
            Options.key("body")
                    .stringType()
                    .noDefaultValue()
                    .withDescription("HTTP request body");

    public static final Option<String> FORMAT =
            Options.key("format")
                    .stringType()
                    .defaultValue("json")
                    .withDescription("Response data format");

    public static final OptionRule OPTION_RULE =
            OptionRule.builder()
                    .required(URL, METHOD)
                    .optional(HEADERS, PARAMS, BODY, FORMAT)
                    .build();

    public static final OptionRule METADATA_RULE = OptionRule.builder().build();
}
