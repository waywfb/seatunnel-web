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

import java.util.HashMap;
import java.util.Map;

import static com.google.common.base.Preconditions.checkArgument;

public class HttpRequestParamsUtils {

    public static Map<String, String> parseParamsFromRequestParams(
            Map<String, String> requestParams) {
        checkArgument(
                requestParams.containsKey(HttpOptionRule.URL.key()),
                String.format("Missing %s in requestParams", HttpOptionRule.URL.key()));

        Map<String, String> result = new HashMap<>();
        result.put(HttpOptionRule.URL.key(), requestParams.get(HttpOptionRule.URL.key()));

        if (requestParams.containsKey(HttpOptionRule.METHOD.key())) {
            result.put(HttpOptionRule.METHOD.key(), requestParams.get(HttpOptionRule.METHOD.key()));
        }
        if (requestParams.containsKey(HttpOptionRule.HEADERS.key())) {
            result.put(
                    HttpOptionRule.HEADERS.key(), requestParams.get(HttpOptionRule.HEADERS.key()));
        }
        if (requestParams.containsKey(HttpOptionRule.PARAMS.key())) {
            result.put(HttpOptionRule.PARAMS.key(), requestParams.get(HttpOptionRule.PARAMS.key()));
        }
        if (requestParams.containsKey(HttpOptionRule.BODY.key())) {
            result.put(HttpOptionRule.BODY.key(), requestParams.get(HttpOptionRule.BODY.key()));
        }
        if (requestParams.containsKey(HttpOptionRule.FORMAT.key())) {
            result.put(HttpOptionRule.FORMAT.key(), requestParams.get(HttpOptionRule.FORMAT.key()));
        }
        return result;
    }
}
