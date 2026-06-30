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

import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginException;
import org.apache.seatunnel.datasource.plugin.api.model.TableField;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class JsonSchemaDerivationUtilsTest {

    @Test
    public void testDeriveFromJson_Object() {
        String json = "{\"name\":\"test\", \"age\":30, \"score\":95.5, \"active\":true}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(4, fields.size());
        assertField(fields, "name", "string");
        assertField(fields, "age", "bigint");
        assertField(fields, "score", "double");
        assertField(fields, "active", "boolean");
    }

    @Test
    public void testDeriveFromJson_NestedObject() {
        String json = "{\"cityInfo\": {\"city\": \"北京\", \"citykey\": \"101010100\"}}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "cityInfo", "string");
    }

    @Test
    public void testDeriveFromJson_Array() {
        String json = "{\"items\": [1, 2, 3]}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "items", "string");
    }

    @Test
    public void testDeriveFromJson_TopLevelPrimitive() {
        String json = "\"hello\"";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "value", "string");
    }

    @Test
    public void testDeriveFromJson_TopLevelNumber() {
        String json = "123";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "value", "bigint");
    }

    @Test
    public void testDeriveFromJson_TopLevelArray() {
        String json = "[1, 2, 3]";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "item", "bigint");
    }

    @Test
    public void testDeriveFromJson_TopLevelArrayOfObjects() {
        String json = "[{\"a\": 1}, {\"b\": 2}]";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "item", "string");
    }

    @Test
    public void testDeriveFromJson_EmptyObject() {
        String json = "{}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertTrue(fields.isEmpty());
    }

    @Test
    public void testDeriveFromJson_NullField() {
        String json = "{\"a\": null}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(1, fields.size());
        assertField(fields, "a", "string");
    }

    @Test
    public void testDeriveFromJson_InvalidJson() {
        Assertions.assertThrows(
                DataSourcePluginException.class,
                () -> JsonSchemaDerivationUtils.deriveFromJson("{invalid}"));
    }

    @Test
    public void testDeriveFromJson_NullInput() {
        Assertions.assertThrows(
                DataSourcePluginException.class,
                () -> JsonSchemaDerivationUtils.deriveFromJson(null));
    }

    @Test
    public void testDeriveFromJson_EmptyInput() {
        Assertions.assertThrows(
                DataSourcePluginException.class,
                () -> JsonSchemaDerivationUtils.deriveFromJson(""));
    }

    @Test
    public void testDeriveFromJson_WeatherSample() {
        String json =
                "{"
                        + "\"message\": \"success\","
                        + "\"status\": 200,"
                        + "\"pm25\": 6.0,"
                        + "\"quality\": \"良\","
                        + "\"cityInfo\": {\"city\": \"北京市\"},"
                        + "\"forecast\": [1, 2, 3]"
                        + "}";
        List<TableField> fields = JsonSchemaDerivationUtils.deriveFromJson(json);
        Assertions.assertEquals(6, fields.size());
        assertField(fields, "message", "string");
        assertField(fields, "status", "bigint");
        assertField(fields, "pm25", "double");
        assertField(fields, "quality", "string");
        assertField(fields, "cityInfo", "string");
        assertField(fields, "forecast", "string");
    }

    private void assertField(List<TableField> fields, String name, String expectedType) {
        TableField field =
                fields.stream().filter(f -> f.getName().equals(name)).findFirst().orElse(null);
        Assertions.assertNotNull(field, "Field " + name + " not found");
        Assertions.assertEquals(expectedType, field.getType());
        Assertions.assertEquals(expectedType, field.getOutputDataType());
    }
}
