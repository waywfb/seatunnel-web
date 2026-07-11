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

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

public class FtpOptionRule {

    public static final Option<String> HOST =
            Options.key("host").stringType().noDefaultValue().withDescription("FTP server host");

    public static final Option<Integer> PORT =
            Options.key("port").intType().defaultValue(21).withDescription("FTP server port");

    public static final Option<String> USERNAME =
            Options.key("username").stringType().noDefaultValue().withDescription("FTP username");

    public static final Option<String> PASSWORD =
            Options.key("password").stringType().noDefaultValue().withDescription("FTP password");

    public static final Option<String> PROTOCOL =
            Options.key("protocol")
                    .stringType()
                    .defaultValue("ftp")
                    .withDescription("FTP protocol type: ftp or ftps");

    public static final Option<String> BASE_DIR =
            Options.key("base_dir")
                    .stringType()
                    .noDefaultValue()
                    .withDescription("FTP base directory");

    public static final Option<String> TYPE =
            Options.key("type").stringType().noDefaultValue().withDescription("File format type");

    public static final Option<String> FILE_PATH =
            Options.key("file_path").stringType().noDefaultValue().withDescription("File path");

    public static final Option<Boolean> PASSIVE_MODE =
            Options.key("passive_mode")
                    .booleanType()
                    .defaultValue(true)
                    .withDescription("Enable FTP passive mode");

    public static final Option<Integer> CONNECT_TIMEOUT =
            Options.key("connect_timeout")
                    .intType()
                    .defaultValue(10000)
                    .withDescription("FTP connection timeout in milliseconds");

    public static final Option<Integer> SO_TIMEOUT =
            Options.key("so_timeout")
                    .intType()
                    .defaultValue(10000)
                    .withDescription("FTP socket timeout in milliseconds");

    public static OptionRule optionRule() {
        return OptionRule.builder()
                .required(HOST, PORT, USERNAME, PASSWORD)
                .optional(PROTOCOL, BASE_DIR, PASSIVE_MODE, CONNECT_TIMEOUT, SO_TIMEOUT)
                .build();
    }

    public static OptionRule metadataRule() {
        return OptionRule.builder().required(TYPE, FILE_PATH).build();
    }
}
