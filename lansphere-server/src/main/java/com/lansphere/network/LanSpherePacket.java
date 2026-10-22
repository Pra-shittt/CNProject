package com.lansphere.network;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Wire model for the LanSphere Application Layer Protocol (LSAP).
 * The matching {@code PacketCodec} validates framing and integrity before a
 * packet reaches a networking service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanSpherePacket implements Serializable {
    public static final short MAGIC_HEADER = 0x4C53; // 'LS' in ASCII hex
    public static final byte PROTOCOL_VERSION = 0x01;

    private short magic;           // 2 bytes magic header
    private byte version;          // 1 byte protocol version
    private byte opcode;
    private long sequenceNumber;
    private long senderNodeId;
    private int payloadLength;
    private String checksumSha256;
    private byte[] payload;

    /** Stable identifier used for deduplication and acknowledgements. */
    @Builder.Default
    private String packetId = UUID.randomUUID().toString();
    /** Milliseconds since epoch, generated at packet creation time. */
    @Builder.Default
    private long timestamp = Instant.now().toEpochMilli();
    private String sender;
    private String receiver;
    @Builder.Default
    private boolean encrypted = false;

    public PacketType getPacketType() {
        return PacketType.fromCode(opcode);
    }

    public void setPacketType(PacketType packetType) {
        this.opcode = packetType.getCode();
    }
}
