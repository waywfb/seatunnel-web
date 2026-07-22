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
import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.api.configuration.util.RequiredOption;
import org.apache.seatunnel.app.domain.request.connector.BusinessMode;
import org.apache.seatunnel.app.dynamicforms.FormStructure;
import org.apache.seatunnel.app.thirdparty.datasource.AbstractDataSourceConfigSwitcher;
import org.apache.seatunnel.app.thirdparty.datasource.DataSourceConfigSwitcher;
import org.apache.seatunnel.common.constants.PluginType;
import org.apache.seatunnel.datasource.plugin.sftp.SftpOptionRule;

import com.google.auto.service.AutoService;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;

@Slf4j
@AutoService(DataSourceConfigSwitcher.class)
public class SftpDataSourceConfigSwitcher extends AbstractDataSourceConfigSwitcher {

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

    public SftpDataSourceConfigSwitcher() {}

    @Override
    public String getDataSourceName() {
        return "SFTP";
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
        excludedKeys.add(SftpOptionRule.HOST.key());
        excludedKeys.add(SftpOptionRule.PORT.key());
        excludedKeys.add(SftpOptionRule.USERNAME.key());
        excludedKeys.add(SftpOptionRule.PASSWORD.key());
        excludedKeys.add(SftpOptionRule.TYPE.key());
        excludedKeys.add(SftpOptionRule.FILE_PATH.key());

        excludedKeys.addAll(FORMAT_FIELD_KEYS);

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
}
