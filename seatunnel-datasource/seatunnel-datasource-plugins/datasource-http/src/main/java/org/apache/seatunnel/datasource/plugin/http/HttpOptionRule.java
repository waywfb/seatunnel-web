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

package org.apache.seatunnel.datasource.plugin.http;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;
import org.apache.seatunnel.api.configuration.util.OptionRule;

import java.util.Map;

public class HttpOptionRule {

    public static final Option<String> URL =
            Options.key("url").stringType().noDefaultValue().withDescription("HTTP request URL");

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
            Options.key("body").stringType().noDefaultValue().withDescription("HTTP request body");

    public static final Option<String> FORMAT =
            Options.key("format")
                    .stringType()
                    .defaultValue("json")
                    .withDescription("Response data format");

    public static OptionRule optionRule() {
        return OptionRule.builder()
                .required(URL, METHOD)
                .optional(HEADERS, PARAMS, BODY, FORMAT)
                .build();
    }

    public static OptionRule metadataRule() {
        return OptionRule.builder().build();
    }
}
