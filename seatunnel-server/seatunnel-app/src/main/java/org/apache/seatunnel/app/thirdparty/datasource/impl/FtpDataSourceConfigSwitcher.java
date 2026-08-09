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

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.api.configuration.util.RequiredOption;
import org.apache.seatunnel.app.domain.request.connector.BusinessMode;
import org.apache.seatunnel.app.domain.request.job.DataSourceOption;
import org.apache.seatunnel.app.domain.request.job.SelectTableFields;
import org.apache.seatunnel.app.domain.response.datasource.VirtualTableDetailRes;
import org.apache.seatunnel.app.dynamicforms.DynamicSelectOption;
import org.apache.seatunnel.app.dynamicforms.FormOptionBuilder;
import org.apache.seatunnel.app.dynamicforms.FormStructure;
import org.apache.seatunnel.app.thirdparty.datasource.AbstractDataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.datasource.DataSourceConfigSwitcher;
import org.apache.seatunnel.common.constants.PluginType;
import org.apache.seatunnel.datasource.plugin.ftp.FtpOptionRule;

import com.google.auto.service.AutoService;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;

@Slf4j
@AutoService(DataSourceConfigSwitcher.class)
public class FtpDataSourceConfigSwitcher extends AbstractDataSourceConfigSwitcher {

    private static final String DATA_STANDARD_ID_KEY = "data_standard_id";

    private static final Option<String> DATA_STANDARD_ID =
            Options.key(DATA_STANDARD_ID_KEY)
                    .stringType()
                    .noDefaultValue()
                    .withDescription("数据标准ID，选择后自动填充格式相关字段");

    private static final List<String> FORMAT_FIELD_KEYS =
            Arrays.asList(
                    "encoding",
                    "record_separator",
                    "field_separator",
                    "schema",
                    "csv_allow_no_line_breaks",
                    "csv_ignore_quote_error",
                    "csv_quote_char",
                    "csv_escape_char",
                    "csv_comment",
                    "json_schema",
                    "json_support_chunking",
                    "json_batch_size",
                    "excel_sheet_name",
                    "text_file_path",
                    "file_format_type_file_name");

    public FtpDataSourceConfigSwitcher() {}

    @Override
    public String getDataSourceName() {
        return "FTP";
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
        // Exclude FTP-specific options that are set at datasource level, not connector level
        excludedKeys.add(FtpOptionRule.HOST.key());
        excludedKeys.add(FtpOptionRule.PORT.key());
        excludedKeys.add(FtpOptionRule.USERNAME.key());
        excludedKeys.add(FtpOptionRule.PASSWORD.key());
        excludedKeys.add(FtpOptionRule.PROTOCOL.key());
        excludedKeys.add(FtpOptionRule.PASSIVE_MODE.key());
        excludedKeys.add(FtpOptionRule.CONNECT_TIMEOUT.key());
        excludedKeys.add(FtpOptionRule.SO_TIMEOUT.key());
        excludedKeys.add(FtpOptionRule.TYPE.key());

        excludedKeys.addAll(FORMAT_FIELD_KEYS);

        FormStructure formStructure =
                super.filterOptionRule(
                        connectorName,
                        dataSourceOptionRule,
                        virtualTableOptionRule,
                        businessMode,
                        pluginType,
                        connectorOptionRule,
                        addRequiredOptions,
                        addOptionalOptions,
                        excludedKeys);

        DynamicSelectOption dataStandardSelect =
                FormOptionBuilder.builder()
                        .withLabel("数据标准")
                        .withField(DATA_STANDARD_ID_KEY)
                        .dynamicSelectOptionBuilder()
                        .withSelectApi(DATA_STANDARD_ID_KEY)
                        .formDynamicSelectOption();
        formStructure.getForms().add(0, dataStandardSelect);

        if (formStructure.getApis() == null) {
            formStructure.setApis(new java.util.HashMap<>());
        }
        formStructure
                .getApis()
                .put(
                        DATA_STANDARD_ID_KEY,
                        new java.util.HashMap<String, String>() {
                            {
                                put("url", "/seatunnel/api/v1/data-standard/enabled-list");
                                put("method", "get");
                            }
                        });
        formStructure
                .getApis()
                .put(
                        "schema",
                        new java.util.HashMap<String, String>() {
                            {
                                put(
                                        "url",
                                        "/seatunnel/api/v1/data-standard/{data_standard_id}/schema");
                                put("method", "get");
                            }
                        });

        return formStructure;
    }

    @Override
    public org.apache.seatunnel.shade.com.typesafe.config.Config mergeDatasourceConfig(
            org.apache.seatunnel.shade.com.typesafe.config.Config dataSourceInstanceConfig,
            VirtualTableDetailRes virtualTableDetail,
            DataSourceOption dataSourceOption,
            SelectTableFields selectTableFields,
            BusinessMode businessMode,
            PluginType pluginType,
            org.apache.seatunnel.shade.com.typesafe.config.Config connectorConfig) {

        org.apache.seatunnel.shade.com.typesafe.config.Config merged =
                super.mergeDatasourceConfig(
                        dataSourceInstanceConfig,
                        virtualTableDetail,
                        dataSourceOption,
                        selectTableFields,
                        businessMode,
                        pluginType,
                        connectorConfig);

        // FTP connector expects key "user" but datasource config stores "username"
        if (dataSourceInstanceConfig.hasPath("username") && !merged.hasPath("user")) {
            merged = merged.withValue("user", dataSourceInstanceConfig.getValue("username"));
        }

        return merged;
    }
}
