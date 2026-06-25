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

package org.apache.seatunnel.datasource.plugin.cdc.mysql;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

public class MysqlCDCOptionRule {

    public static final Option<String> HOST =
            Options.key("host").stringType().noDefaultValue().withDescription("数据库服务器主机名或 IP 地址。");

    public static final Option<Integer> PORT =
            Options.key("port").intType().defaultValue(3306).withDescription("数据库服务器端口。");

    public static final Option<String> BASE_URL =
            Options.key("base-url")
                    .stringType()
                    .noDefaultValue()
                    .withDescription(
                            "JDBC 连接 URL（不含数据库名），如 \"jdbc:mysql://localhost:5432/\"。"
                                    + "如果已填写 host 和 port 则可省略。");

    public static final Option<String> USERNAME =
            Options.key("username").stringType().noDefaultValue().withDescription("连接数据库的用户名。");

    public static final Option<String> PASSWORD =
            Options.key("password").stringType().noDefaultValue().withDescription("连接数据库的密码。");

    public static final Option<String> DATABASE_NAME =
            Options.key("database-name")
                    .stringType()
                    .noDefaultValue()
                    .withDescription("需要监控的数据库名。");

    public static final Option<String> TABLE_NAME =
            Options.key("table-name").stringType().noDefaultValue().withDescription("需要监控的表名。");
    public static final Option<String> SERVER_TIME_ZONE =
            Options.key("server-time-zone")
                    .stringType()
                    .defaultValue("UTC")
                    .withDescription("数据库服务器会话时区。");

    public static OptionRule optionRule() {
        return OptionRule.builder()
                .required(USERNAME, PASSWORD)
                .optional(HOST, PORT, BASE_URL, SERVER_TIME_ZONE)
                .build();
    }

    public static OptionRule metadataRule() {
        return OptionRule.builder().required(DATABASE_NAME, TABLE_NAME).build();
    }
}
