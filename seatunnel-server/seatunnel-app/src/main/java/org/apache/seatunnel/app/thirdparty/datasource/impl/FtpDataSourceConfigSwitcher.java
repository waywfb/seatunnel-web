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
import org.apache.seatunnel.datasource.plugin.ftp.FtpOptionRule;

import com.google.auto.service.AutoService;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@AutoService(DataSourceConfigSwitcher.class)
public class FtpDataSourceConfigSwitcher extends AbstractDataSourceConfigSwitcher {

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
