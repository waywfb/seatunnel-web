/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.app.thirdparty.datasource.impl;

import org.apache.seatunnel.shade.com.typesafe.config.Config;
import org.apache.seatunnel.shade.com.typesafe.config.ConfigFactory;
import org.apache.seatunnel.shade.com.typesafe.config.ConfigValueFactory;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.Condition;
import org.apache.seatunnel.api.configuration.util.Expression;
import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.api.configuration.util.RequiredOption;
import org.apache.seatunnel.app.domain.request.connector.BusinessMode;
import org.apache.seatunnel.app.domain.request.job.DataSourceOption;
import org.apache.seatunnel.app.domain.request.job.SelectTableFields;
import org.apache.seatunnel.app.domain.response.datasource.VirtualTableDetailRes;
import org.apache.seatunnel.app.dynamicforms.FormStructure;
import org.apache.seatunnel.app.thirdparty.datasource.AbstractDataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.datasource.DataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.framework.SeaTunnelOptionRuleWrapper;
import org.apache.seatunnel.common.constants.PluginType;

import com.google.auto.service.AutoService;

import java.util.Arrays;
import java.util.List;

@AutoService(DataSourceConfigSwitcher.class)
public class Plc4xDataSourceConfigSwitcher extends AbstractDataSourceConfigSwitcher {

    private static final String PROTOCOL_VALUE = "opcua";
    private static final String PROTOCOL_KEY = "protocol";

    @Override
    public String getDataSourceName() {
        return "OPCUA";
    }

    @Override
    public FormStructure filterOptionRule(
            String connectorName,
            OptionRule dataSourceOptionRule,
            OptionRule virtualTableOptionRule,
            BusinessMode businessMode,
            PluginType pluginType,
            OptionRule connectorOptionRule,
            List<RequiredOption> addRequiredOptions,
            List<Option<?>> addOptionalOptions,
            List<String> excludedKeys) {
        // Exclude protocol since the switcher auto-sets it based on datasource type
        excludedKeys.add(PROTOCOL_KEY);
        excludedKeys.add("tag_addresses");
        excludedKeys.add("tags");
        excludedKeys.add("connection_string");
        excludedKeys.add("host");
        excludedKeys.add("port");

        Option<String> modeOption =
                Options.key("mode")
                        .singleChoice(String.class, Arrays.asList("polling", "subscription"))
                        .defaultValue("polling")
                        .withDescription("采集模式：轮询｜订阅");
        addRequiredOptions.add(RequiredOption.AbsolutelyRequiredOptions.of(modeOption));

        Option<String> subscriptionTypeOption =
                Options.key("subscription_type")
                        .singleChoice(
                                String.class, Arrays.asList("cyclic", "change_of_state", "event"))
                        .defaultValue("cyclic")
                        .withDescription("订阅类型：周期轮询、状态变更、事件触发");

        Option<Long> subscriptionIntervalMsOption =
                Options.key("subscription_interval_ms")
                        .longType()
                        .defaultValue(1000L)
                        .withDescription("订阅模式下检查/轮询间隔（毫秒）");

        addRequiredOptions.add(
                RequiredOption.ConditionalRequiredOptions.of(
                        Expression.of(Condition.of(modeOption, "subscription")),
                        Arrays.asList(subscriptionTypeOption, subscriptionIntervalMsOption)));

        Option<Long> pollIntervalMsOption =
                Options.key("poll_interval_ms")
                        .longType()
                        .defaultValue(3000L)
                        .withDescription("轮询模式下读取间隔（毫秒）");

        addRequiredOptions.add(
                RequiredOption.ConditionalRequiredOptions.of(
                        Expression.of(Condition.of(modeOption, "polling")),
                        Arrays.asList(pollIntervalMsOption)));

        if (connectorOptionRule == null) {
            return SeaTunnelOptionRuleWrapper.wrapper(
                    OptionRule.builder().build(), connectorName + "[" + pluginType.getType() + "]");
        }
        return super.filterOptionRule(
                connectorName,
                dataSourceOptionRule,
                virtualTableOptionRule,
                businessMode,
                pluginType,
                connectorOptionRule,
                addRequiredOptions,
                addOptionalOptions,
                excludedKeys);
    }

    @Override
    public Config mergeDatasourceConfig(
            Config dataSourceInstanceConfig,
            VirtualTableDetailRes virtualTableDetail,
            DataSourceOption dataSourceOption,
            SelectTableFields selectTableFields,
            BusinessMode businessMode,
            PluginType pluginType,
            Config connectorConfig) {
        if (connectorConfig == null) {
            connectorConfig = ConfigFactory.empty();
        }

        // Set PLC4J protocol based on datasource type (OPCUA)
        connectorConfig =
                connectorConfig.withValue(
                        PROTOCOL_KEY, ConfigValueFactory.fromAnyRef(PROTOCOL_VALUE));

        // Copy host and port from datasource config if present
        if (dataSourceInstanceConfig.hasPath("host")) {
            connectorConfig =
                    connectorConfig.withValue("host", dataSourceInstanceConfig.getValue("host"));
        }
        if (dataSourceInstanceConfig.hasPath("port")) {
            connectorConfig =
                    connectorConfig.withValue("port", dataSourceInstanceConfig.getValue("port"));
        }

        if (selectTableFields != null
                && selectTableFields.getTableFields() != null
                && !selectTableFields.getTableFields().isEmpty()) {
            connectorConfig =
                    connectorConfig.withValue(
                            "tag_addresses",
                            ConfigValueFactory.fromIterable(selectTableFields.getTableFields()));
            connectorConfig =
                    connectorConfig.withValue(
                            "tags",
                            ConfigValueFactory.fromIterable(selectTableFields.getTableFields()));
        }

        return super.mergeDatasourceConfig(
                dataSourceInstanceConfig,
                virtualTableDetail,
                dataSourceOption,
                selectTableFields,
                businessMode,
                pluginType,
                connectorConfig);
    }
}
