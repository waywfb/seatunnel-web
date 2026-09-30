package org.apache.seatunnel.app.service.bridge.impl;

import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.plc4x.java.opcua.tag.OpcuaTag;
import org.apache.plc4x.java.s7.readwrite.tag.S7Tag;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** 在线试读的地址归一化：S7 与 OPC UA 的地址必须能被 PLC4X 驱动解析。 */
class BridgeClientAddressTest {

    @Test
    void s7AddressGetsPercentPrefixTypeSuffixAndBitOffset() {
        assertEquals("%DB1:5:DINT", BridgeClientImpl.normalizeS7Address("DB1:5", "INT32"));
        assertEquals("%DB1:5:REAL", BridgeClientImpl.normalizeS7Address("%DB1:5", "FLOAT32"));
        assertEquals("%M100.0:BOOL", BridgeClientImpl.normalizeS7Address("%M100:BOOL", null));
        assertEquals("%I0.0:BOOL", BridgeClientImpl.normalizeS7Address("I0:BOOL", "BOOL"));
        assertEquals("%DB1.0:INT", BridgeClientImpl.normalizeS7Address("%DB1.0:INT", "INT32"));
        assertEquals("%M100:INT", BridgeClientImpl.normalizeS7Address("M100", "INT16"));
    }

    @Test
    void s7AddressRejectsBlankAddress() {
        assertThrows(
                SeatunnelException.class, () -> BridgeClientImpl.normalizeS7Address(null, null));
        assertThrows(
                SeatunnelException.class, () -> BridgeClientImpl.normalizeS7Address("  ", "INT16"));
    }

    @Test
    void formattedS7AddressIsParseableAndKeepsEveryField() {
        String[] addresses = {
            "%DB1:5:INT",
            "%DB1:5:REAL",
            "%DB1:5:STRING",
            "%M100.0:BOOL",
            "%M100:BYTE",
            "%I0.0:BOOL",
            "%Q0.0:BOOL",
            "%T0:S5TIME",
            "%C0:INT"
        };
        for (String address : addresses) {
            S7Tag original = S7Tag.of(address);
            String formatted = BridgeClientImpl.formatS7Address(original);
            S7Tag reparsed = S7Tag.of(formatted);
            assertEquals(original.getMemoryArea(), reparsed.getMemoryArea(), address);
            assertEquals(original.getBlockNumber(), reparsed.getBlockNumber(), address);
            assertEquals(original.getByteOffset(), reparsed.getByteOffset(), address);
            assertEquals(original.getBitOffset(), reparsed.getBitOffset(), address);
            assertEquals(original.getPlcDataType(), reparsed.getPlcDataType(), address);
        }
    }

    @Test
    void opcUaAddressDropsPercentAndNamespaceUriPrefix() {
        assertEquals("ns=2;s=Foo", BridgeClientImpl.normalizeOpcUaAddress("%ns=2;s=Foo"));
        assertEquals("ns=3;i=42", BridgeClientImpl.normalizeOpcUaAddress(" ns=3;i=42 "));
        assertEquals(
                "ns=2;s=Foo",
                BridgeClientImpl.normalizeOpcUaAddress("nsu=http://plc:4840;ns=2;s=Foo"));
    }

    @Test
    void opcUaAddressIsAcceptedByDriver() {
        OpcuaTag.of(BridgeClientImpl.normalizeOpcUaAddress("nsu=http://plc:4840;ns=2;s=Foo"));
        OpcuaTag tag = OpcuaTag.of(BridgeClientImpl.normalizeOpcUaAddress("ns=3;i=42"));
        assertEquals(3, tag.getNamespace());
        assertEquals("42", tag.getIdentifier());
    }

    @Test
    void opcUaAddressRejectsBlankAndUnresolvableNodeId() {
        assertThrows(SeatunnelException.class, () -> BridgeClientImpl.normalizeOpcUaAddress(null));
        assertThrows(
                SeatunnelException.class,
                () -> BridgeClientImpl.normalizeOpcUaAddress("nsu=http://plc:4840"));
    }
}
