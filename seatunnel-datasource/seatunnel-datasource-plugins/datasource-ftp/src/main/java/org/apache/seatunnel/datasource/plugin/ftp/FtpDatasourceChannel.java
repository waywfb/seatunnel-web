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

package org.apache.seatunnel.datasource.plugin.ftp;

import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.datasource.plugin.api.DataSourceChannel;
import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginException;
import org.apache.seatunnel.datasource.plugin.api.model.TableField;

import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
public class FtpDatasourceChannel implements DataSourceChannel {

    @Override
    public OptionRule getDataSourceOptions(@NonNull String pluginName) {
        return FtpOptionRule.optionRule();
    }

    @Override
    public OptionRule getDatasourceMetadataFieldsByDataSourceName(@NonNull String pluginName) {
        return FtpOptionRule.metadataRule();
    }

    @Override
    public List<String> getTables(
            @NonNull String pluginName,
            Map<String, String> requestParams,
            String database,
            Map<String, String> options) {
        return Collections.emptyList();
    }

    @Override
    public List<String> getDatabases(
            @NonNull String pluginName, @NonNull Map<String, String> requestParams) {
        return Collections.emptyList();
    }

    @Override
    public boolean checkDataSourceConnectivity(
            @NonNull String pluginName, @NonNull Map<String, String> requestParams) {
        String host = requestParams.get("host");
        String portStr = requestParams.get("port");
        String username = requestParams.get("username");
        String password = requestParams.get("password");
        String protocol = requestParams.getOrDefault("protocol", "ftp");
        boolean passiveMode =
                Boolean.parseBoolean(requestParams.getOrDefault("passive_mode", "true"));

        int port = 21;
        if (portStr != null && !portStr.isEmpty()) {
            try {
                port = Integer.parseInt(portStr);
            } catch (NumberFormatException e) {
                throw new DataSourcePluginException("Invalid FTP port: " + portStr, e);
            }
        }

        FTPClient ftpClient = new FTPClient();
        try {
            ftpClient.connect(host, port);
            int replyCode = ftpClient.getReplyCode();
            if (!FTPReply.isPositiveCompletion(replyCode)) {
                throw new DataSourcePluginException(
                        String.format(
                                "FTP server refused connection, host: %s, port: %d, replyCode: %d",
                                host, port, replyCode));
            }

            if (passiveMode) {
                ftpClient.enterLocalPassiveMode();
            }

            boolean loggedIn = ftpClient.login(username, password);
            if (!loggedIn) {
                throw new DataSourcePluginException(
                        String.format(
                                "FTP login failed, host: %s, port: %d, username: %s",
                                host, port, username));
            }

            ftpClient.logout();
            return true;
        } catch (IOException e) {
            throw new DataSourcePluginException(
                    String.format("FTP connectivity check failed, host: %s, port: %d", host, port),
                    e);
        } finally {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.disconnect();
                } catch (IOException e) {
                    log.warn("Error disconnecting FTP client", e);
                }
            }
        }
    }

    @Override
    public List<TableField> getTableFields(
            @NonNull String pluginName,
            @NonNull Map<String, String> requestParams,
            @NonNull String database,
            @NonNull String table) {
        return new ArrayList<>();
    }

    @Override
    public Map<String, List<TableField>> getTableFields(
            @NonNull String pluginName,
            @NonNull Map<String, String> requestParams,
            @NonNull String database,
            @NonNull List<String> tables) {
        return Collections.emptyMap();
    }
}
