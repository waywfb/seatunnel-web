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

package org.apache.seatunnel.datasource.plugin.sftp;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

public class SftpOptionRule {

    public static final Option<String> HOST =
            Options.key("host").stringType().noDefaultValue().withDescription("SFTP server host");

    public static final Option<Integer> PORT =
            Options.key("port").intType().defaultValue(22).withDescription("SFTP server port");

    public static final Option<String> USERNAME =
            Options.key("user").stringType().noDefaultValue().withDescription("SFTP username");

    public static final Option<String> PASSWORD =
            Options.key("password").stringType().noDefaultValue().withDescription("SFTP password");

    public static final Option<String> TYPE =
            Options.key("type").stringType().noDefaultValue().withDescription("File format type");

    public static final Option<String> FILE_PATH =
            Options.key("file_path").stringType().noDefaultValue().withDescription("File path");

    public static OptionRule optionRule() {
        return OptionRule.builder()
                .required(HOST, PORT, USERNAME, PASSWORD)
                .build();
    }

    public static OptionRule metadataRule() {
        return OptionRule.builder().required(TYPE, FILE_PATH).build();
    }
}
