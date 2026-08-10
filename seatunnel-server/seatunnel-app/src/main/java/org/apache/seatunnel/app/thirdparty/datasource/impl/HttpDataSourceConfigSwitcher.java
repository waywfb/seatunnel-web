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
import org.apache.seatunnel.api.configuration.util.Condition;
import org.apache.seatunnel.api.configuration.util.Expression;
import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.api.configuration.util.RequiredOption;
import org.apache.seatunnel.app.domain.request.connector.BusinessMode;
import org.apache.seatunnel.app.domain.request.job.DataSourceOption;
import org.apache.seatunnel.app.domain.request.job.SelectTableFields;
import org.apache.seatunnel.app.domain.response.datasource.VirtualTableDetailRes;
import org.apache.seatunnel.app.domain.response.datasource.VirtualTableFieldRes;
import org.apache.seatunnel.app.dynamicforms.FormStructure;
import org.apache.seatunnel.app.thirdparty.datasource.AbstractDataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.datasource.DataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.framework.UnSupportWrapperException;
import org.apache.seatunnel.common.constants.PluginType;

import org.apache.commons.collections4.CollectionUtils;

import com.google.auto.service.AutoService;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@AutoService(DataSourceConfigSwitcher.class)
public class HttpDataSourceConfigSwitcher extends AbstractDataSourceConfigSwitcher {

    private static final String SCHEMA = "schema";

    @Override
    public String getDataSourceName() {
        return "HTTP";
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
        if (pluginType == PluginType.SOURCE) {
            excludedKeys.add(SCHEMA);
        }
        OptionRule adjustedConnectorOptionRule =
                downgradeConditionalOptions(
                        connectorName,
                        connectorOptionRule,
                        dataSourceOptionRule,
                        virtualTableOptionRule,
                        excludedKeys);
        return super.filterOptionRule(
                connectorName,
                dataSourceOptionRule,
                virtualTableOptionRule,
                businessMode,
                pluginType,
                adjustedConnectorOptionRule,
                addRequiredOptions,
                addOptionalOptions,
                excludedKeys);
    }

    /**
     * The Http connector declares `schema` as conditionally required when `format == json`. Since
     * `format` is a datasource-level field it is filtered out of the connector form, leaving a
     * dangling show reference that fails FormStructureValidate. Downgrade such conditional-required
     * options to plain required options so the form stays valid.
     */
    private OptionRule downgradeConditionalOptions(
            String connectorName,
            OptionRule connectorOptionRule,
            OptionRule dataSourceOptionRule,
            OptionRule virtualTableOptionRule,
            List<String> excludedKeys) {
        Set<String> dataSourceFieldKeys = new HashSet<>();
        Stream.concat(
                        dataSourceOptionRule.getRequiredOptions().stream(),
                        virtualTableOptionRule.getRequiredOptions().stream())
                .flatMap(requiredOption -> requiredOption.getOptions().stream())
                .map(Option::key)
                .forEach(dataSourceFieldKeys::add);
        Stream.concat(
                        dataSourceOptionRule.getOptionalOptions().stream(),
                        virtualTableOptionRule.getOptionalOptions().stream())
                .map(Option::key)
                .forEach(dataSourceFieldKeys::add);
        dataSourceFieldKeys.addAll(excludedKeys);

        boolean needDowngrade =
                connectorOptionRule.getRequiredOptions().stream()
                        .anyMatch(
                                ro ->
                                        ro instanceof RequiredOption.ConditionalRequiredOptions
                                                && dataSourceFieldKeys.contains(
                                                        conditionFieldKey(
                                                                (RequiredOption
                                                                                .ConditionalRequiredOptions)
                                                                        ro)));
        if (!needDowngrade) {
            return connectorOptionRule;
        }

        OptionRule.Builder builder = OptionRule.builder();
        builder.optional(connectorOptionRule.getOptionalOptions().toArray(new Option<?>[0]));
        for (RequiredOption requiredOption : connectorOptionRule.getRequiredOptions()) {
            if (requiredOption instanceof RequiredOption.AbsolutelyRequiredOptions) {
                builder.required(requiredOption.getOptions().toArray(new Option<?>[0]));
            } else if (requiredOption instanceof RequiredOption.BundledRequiredOptions) {
                builder.bundled(requiredOption.getOptions().toArray(new Option<?>[0]));
            } else if (requiredOption instanceof RequiredOption.ExclusiveRequiredOptions) {
                builder.exclusive(requiredOption.getOptions().toArray(new Option<?>[0]));
            } else if (requiredOption instanceof RequiredOption.ConditionalRequiredOptions) {
                RequiredOption.ConditionalRequiredOptions conditionalRequired =
                        (RequiredOption.ConditionalRequiredOptions) requiredOption;
                if (dataSourceFieldKeys.contains(conditionFieldKey(conditionalRequired))) {
                    builder.required(conditionalRequired.getOptions().toArray(new Option<?>[0]));
                } else {
                    // 仅用单值重载：List 重载在 Option<Object>/List<Object> 下 ECJ 判歧义（曾致运行时 Unresolved
                    // compilation problem）
                    List<Object> expectValues = expectValues(conditionalRequired.getExpression());
                    if (expectValues.size() != 1) {
                        throw new UnSupportWrapperException(
                                connectorName,
                                "conditional with multiple expect values",
                                requiredOption.toString());
                    }
                    Option<Object> conditionOption =
                            (Option<Object>)
                                    conditionalRequired.getExpression().getCondition().getOption();
                    builder.conditional(
                            conditionOption,
                            expectValues.get(0),
                            conditionalRequired.getOptions().toArray(new Option<?>[0]));
                }
            } else {
                throw new UnSupportWrapperException(
                        connectorName, "Unknown", requiredOption.toString());
            }
        }
        return builder.build();
    }

    private String conditionFieldKey(
            RequiredOption.ConditionalRequiredOptions conditionalRequiredOptions) {
        return conditionalRequiredOptions.getExpression().getCondition().getOption().key();
    }

    private List<Object> expectValues(Expression expression) {
        List<Object> expectValues = new ArrayList<>();
        Condition condition = expression.getCondition();
        expectValues.add(condition.getExpectValue());
        while (expression.hasNext()) {
            expression = expression.getNext();
            expectValues.add(expression.getCondition().getExpectValue());
        }
        return expectValues;
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
        if (pluginType == PluginType.SOURCE
                && virtualTableDetail != null
                && CollectionUtils.isNotEmpty(virtualTableDetail.getFields())) {
            connectorConfig =
                    connectorConfig.withValue(SCHEMA, generateSchema(virtualTableDetail).root());
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

    private Config generateSchema(VirtualTableDetailRes virtualTableDetail) {
        Config schema = ConfigFactory.empty();
        for (VirtualTableFieldRes field : virtualTableDetail.getFields()) {
            schema =
                    schema.withValue(
                            field.getFieldName(),
                            ConfigValueFactory.fromAnyRef(field.getFieldType()));
        }
        return schema.atKey("fields");
    }
}
