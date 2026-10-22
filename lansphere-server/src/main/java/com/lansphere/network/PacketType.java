package com.lansphere.network;

/** Packet kinds carried by the LanSphere Application Layer Protocol. */
public enum PacketType {
    DISCOVERY(1), DISCOVERY_REPLY(2), HEARTBEAT(3), CHAT(4), FILE(5), SCREEN(6),
    ACK(7), ERROR(8), PING(9), PONG(10), DISCONNECT(11);

    private final byte code;

    PacketType(int code) { this.code = (byte) code; }
    public byte getCode() { return code; }

    public static PacketType fromCode(byte code) {
        for (PacketType type : values()) if (type.code == code) return type;
        throw new IllegalArgumentException("Unknown packet type: " + Byte.toUnsignedInt(code));
    }
}
