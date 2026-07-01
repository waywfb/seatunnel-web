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
package org.apache.seatunnel.app.utils;

import org.apache.seatunnel.shade.com.fasterxml.jackson.databind.JsonNode;
import org.apache.seatunnel.shade.com.fasterxml.jackson.databind.node.ArrayNode;

import org.apache.seatunnel.app.domain.response.datasource.FlattenedField;
import org.apache.seatunnel.common.utils.JsonUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

public class JsonFlattenService {

    private static final int MAX_DEPTH = 10;

    public enum FlattenStrategy {
        SMART,
        FLAT_ALL,
        KEEP_JSON,
        CUSTOM
    }

    private JsonFlattenService() {}

    public static List<FlattenedField> flatten(String json, String strategyName) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        FlattenStrategy strategy;
        try {
            strategy = FlattenStrategy.valueOf(strategyName.toUpperCase());
        } catch (IllegalArgumentException e) {
            strategy = FlattenStrategy.KEEP_JSON;
        }
        try {
            JsonNode root = JsonUtils.stringToJsonNode(json);
            return flattenNode(root, strategy, "$");
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON: " + e.getMessage(), e);
        }
    }

    private static List<FlattenedField> flattenNode(
            JsonNode node, FlattenStrategy strategy, String prefix) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return singleton(prefix, "string");
        }
        if (prefix.length() / 2 > MAX_DEPTH) {
            return singleton(prefix, "string");
        }
        switch (strategy) {
            case SMART:
                return flattenSmart(node, prefix);
            case FLAT_ALL:
                return flattenAll(node, prefix);
            case KEEP_JSON:
                return singleton(prefix, "string");
            case CUSTOM:
                return flattenSmart(node, prefix);
            default:
                return singleton(prefix, "string");
        }
    }

    private static List<FlattenedField> flattenSmart(JsonNode node, String prefix) {
        if (node.isObject()) {
            List<FlattenedField> fields = new ArrayList<>();
            Iterator<String> fieldNames = node.fieldNames();
            while (fieldNames.hasNext()) {
                String key = fieldNames.next();
                String childPrefix = prefix + "." + key;
                fields.addAll(flattenNode(node.get(key), FlattenStrategy.SMART, childPrefix));
            }
            return fields;
        }
        if (node.isArray()) {
            return singleton(prefix, "string");
        }
        return singleton(prefix, inferType(node));
    }

    private static List<FlattenedField> flattenAll(JsonNode node, String prefix) {
        if (node.isObject()) {
            List<FlattenedField> fields = new ArrayList<>();
            Iterator<String> fieldNames = node.fieldNames();
            while (fieldNames.hasNext()) {
                String key = fieldNames.next();
                String childPrefix = prefix + "." + key;
                fields.addAll(flattenNode(node.get(key), FlattenStrategy.FLAT_ALL, childPrefix));
            }
            return fields;
        }
        if (node.isArray()) {
            List<FlattenedField> fields = new ArrayList<>();
            ArrayNode array = (ArrayNode) node;
            int limit = Math.min(array.size(), 10);
            for (int i = 0; i < limit; i++) {
                String childPrefix = prefix + "[" + i + "]";
                fields.addAll(flattenNode(array.get(i), FlattenStrategy.FLAT_ALL, childPrefix));
            }
            return fields;
        }
        return singleton(prefix, inferType(node));
    }

    private static List<FlattenedField> singleton(String path, String type) {
        String destField = pathToFieldName(path);
        return Collections.singletonList(new FlattenedField(path, destField, type));
    }

    private static String pathToFieldName(String path) {
        String cleaned = path.replaceAll("^\\$\\.?", "");
        cleaned = cleaned.replaceAll("\\.", "_");
        cleaned = cleaned.replaceAll("\\[", "_");
        cleaned = cleaned.replaceAll("\\]", "");
        return cleaned;
    }

    private static String inferType(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return "string";
        }
        if (node.isTextual()) {
            return "string";
        }
        if (node.isBoolean()) {
            return "boolean";
        }
        if (node.isInt() || node.isLong()) {
            return "bigint";
        }
        if (node.isFloat() || node.isDouble()) {
            return "double";
        }
        return "string";
    }
}
