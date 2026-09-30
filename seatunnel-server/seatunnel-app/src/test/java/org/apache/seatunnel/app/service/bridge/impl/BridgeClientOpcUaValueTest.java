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
package org.apache.seatunnel.app.service.bridge.impl;

import org.eclipse.milo.opcua.stack.core.StatusCodes;
import org.eclipse.milo.opcua.stack.core.types.builtin.ByteString;
import org.eclipse.milo.opcua.stack.core.types.builtin.DateTime;
import org.eclipse.milo.opcua.stack.core.types.builtin.LocalizedText;
import org.eclipse.milo.opcua.stack.core.types.builtin.NodeId;
import org.eclipse.milo.opcua.stack.core.types.builtin.StatusCode;
import org.eclipse.milo.opcua.stack.core.types.builtin.Variant;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;

class BridgeClientOpcUaValueTest {

    @Test
    void testScalarValueToString() {
        Assertions.assertEquals("true", BridgeClientImpl.opcUaValueToString(new Variant(true)));
        Assertions.assertEquals("42", BridgeClientImpl.opcUaValueToString(new Variant(42)));
        Assertions.assertEquals("3.5", BridgeClientImpl.opcUaValueToString(new Variant(3.5d)));
        Assertions.assertEquals("hello", BridgeClientImpl.opcUaValueToString(new Variant("hello")));
    }

    @Test
    void testLocalizedTextValueToString() {
        Assertions.assertEquals(
                "运行中", BridgeClientImpl.opcUaValueToString(new Variant(new LocalizedText("运行中"))));
    }

    @Test
    void testByteArrayValueToHexString() {
        Assertions.assertEquals(
                "00ff10",
                BridgeClientImpl.opcUaValueToString(
                        new Variant(new byte[] {0, (byte) 0xff, 0x10})));
    }

    @Test
    void testArrayValueToString() {
        Assertions.assertEquals(
                "[1, 2, 3]", BridgeClientImpl.opcUaValueToString(new Variant(new int[] {1, 2, 3})));
    }

    @Test
    void testNullVariantToString() {
        Assertions.assertNull(BridgeClientImpl.opcUaValueToString(null));
    }

    @Test
    void testDateTimeValueToIsoUtc() {
        // 源系统原始值形如 2026-09-30T10:47:08.826Z，必须原样输出 ISO-8601 UTC
        Instant instant = Instant.parse("2026-09-30T10:47:08.826Z");
        String expected = "2026-09-30T10:47:08.826Z";

        Assertions.assertEquals(
                expected, BridgeClientImpl.opcUaValueToString(new Variant(new DateTime(instant))));
        Assertions.assertEquals(
                expected, BridgeClientImpl.opcUaValueToString(new Variant(Date.from(instant))));
        Assertions.assertEquals(
                expected, BridgeClientImpl.opcUaValueToString(new Variant(instant)));
        Assertions.assertEquals(
                expected,
                BridgeClientImpl.opcUaValueToString(new Variant(instant.atZone(ZoneOffset.UTC))));
    }

    @Test
    void testDateTimeArrayElementsAreFormatted() {
        Instant instant = Instant.parse("2026-09-30T10:47:08.826Z");
        Assertions.assertEquals(
                "[2026-09-30T10:47:08.826Z, 2026-09-30T10:47:08.826Z]",
                BridgeClientImpl.opcUaValueToString(
                        new Variant(
                                new DateTime[] {new DateTime(instant), new DateTime(instant)})));
    }

    @Test
    void testNullDateTimeToString() {
        Assertions.assertNull(
                BridgeClientImpl.opcUaValueToString(new Variant(DateTime.NULL_VALUE)));
    }

    @Test
    void testByteStringAndNodeIdToString() {
        Assertions.assertEquals(
                "00ff10",
                BridgeClientImpl.opcUaValueToString(
                        new Variant(new ByteString(new byte[] {0, (byte) 0xff, 0x10}))));
        Assertions.assertEquals(
                "ns=2;s=Foo",
                BridgeClientImpl.opcUaValueToString(new Variant(NodeId.parse("ns=2;s=Foo"))));
    }

    @Test
    void testDescribeBadStatus() {
        String message =
                BridgeClientImpl.describeOpcUaStatus(new StatusCode(StatusCodes.Bad_NodeIdUnknown));
        Assertions.assertTrue(message.contains("Bad_NodeIdUnknown"), message);
        Assertions.assertTrue(message.contains("0x80340000"), message);
    }
}
