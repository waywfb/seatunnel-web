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

package org.apache.seatunnel.datasource.plugin.api.utils;

import org.apache.seatunnel.shade.com.fasterxml.jackson.databind.JsonNode;
import org.apache.seatunnel.shade.com.fasterxml.jackson.databind.ObjectMapper;

import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginException;
import org.apache.seatunnel.datasource.plugin.api.model.TableField;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class JsonSchemaDerivationUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonSchemaDerivationUtils() {}

    public static List<TableField> deriveFromJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            throw new DataSourcePluginException("Json is null or empty");
        }
        try {
            JsonNode root = MAPPER.readTree(json);
            return deriveFromJsonNode(root);
        } catch (Exception e) {
            throw new DataSourcePluginException("Failed to parse json: " + e.getMessage(), e);
        }
    }

    public static List<TableField> deriveFromJsonNode(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return Collections.emptyList();
        }

        if (node.isObject()) {
            List<TableField> fields = new ArrayList<>();
            Iterator<Map.Entry<String, JsonNode>> fieldIterator = node.fields();
            while (fieldIterator.hasNext()) {
                Map.Entry<String, JsonNode> entry = fieldIterator.next();
                fields.add(buildField(entry.getKey(), entry.getValue()));
            }
            return fields;
        }

        if (node.isArray() && node.size() > 0) {
            JsonNode first = node.get(0);
            return Collections.singletonList(buildField("item", first));
        }

        if (node.isValueNode()) {
            return Collections.singletonList(buildField("value", node));
        }

        return Collections.singletonList(buildField("value", node));
    }

    private static TableField buildField(String name, JsonNode valueNode) {
        TableField field = new TableField();
        field.setName(name);
        String type = inferSeaTunnelType(valueNode);
        field.setType(type);
        field.setOutputDataType(type);
        field.setNullable(true);
        field.setPrimaryKey(false);
        return field;
    }

    public static String inferSeaTunnelType(JsonNode node) {
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
