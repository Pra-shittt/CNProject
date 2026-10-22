package com.lansphere.network.protocol;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.PacketType;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Serializes LSAP packets with bounded input and SHA-256 integrity checks. */
public final class PacketCodec {
    public static final int MAX_PAYLOAD_BYTES = 16 * 1024 * 1024;

    private PacketCodec() { }

    public static void write(DataOutputStream output, LanSpherePacket packet) throws IOException {
        byte[] payload = packet.getPayload() == null ? new byte[0] : packet.getPayload();
        if (payload.length > MAX_PAYLOAD_BYTES) throw new IOException("Packet payload exceeds limit");
        packet.setMagic(LanSpherePacket.MAGIC_HEADER);
        packet.setVersion(LanSpherePacket.PROTOCOL_VERSION);
        packet.setPayloadLength(payload.length);
        packet.setChecksumSha256(checksum(payload));
        output.writeShort(packet.getMagic());
        output.writeByte(packet.getVersion());
        output.writeByte(packet.getOpcode());
        output.writeLong(packet.getSequenceNumber());
        output.writeLong(packet.getSenderNodeId());
        output.writeUTF(required(packet.getPacketId()));
        output.writeLong(packet.getTimestamp());
        output.writeUTF(nullable(packet.getSender()));
        output.writeUTF(nullable(packet.getReceiver()));
        output.writeBoolean(packet.isEncrypted());
        output.writeInt(payload.length);
        output.writeUTF(packet.getChecksumSha256());
        output.write(payload);
        output.flush();
    }

    public static LanSpherePacket read(DataInputStream input) throws IOException {
        short magic = input.readShort();
        byte version = input.readByte();
        byte opcode = input.readByte();
        if (magic != LanSpherePacket.MAGIC_HEADER || version != LanSpherePacket.PROTOCOL_VERSION) {
            throw new IOException("Unsupported LSAP packet header");
        }
        PacketType.fromCode(opcode);
        long sequence = input.readLong();
        long nodeId = input.readLong();
        String packetId = input.readUTF();
        long timestamp = input.readLong();
        String sender = input.readUTF();
        String receiver = input.readUTF();
        boolean encrypted = input.readBoolean();
        int payloadLength = input.readInt();
        String checksum = input.readUTF();
        if (payloadLength < 0 || payloadLength > MAX_PAYLOAD_BYTES) throw new IOException("Invalid payload length");
        byte[] payload = input.readNBytes(payloadLength);
        if (payload.length != payloadLength || !MessageDigest.isEqual(checksum.getBytes(StandardCharsets.US_ASCII), checksum(payload).getBytes(StandardCharsets.US_ASCII))) {
            throw new IOException("Packet checksum verification failed");
        }
        return LanSpherePacket.builder().magic(magic).version(version).opcode(opcode).sequenceNumber(sequence)
                .senderNodeId(nodeId).packetId(packetId).timestamp(timestamp).sender(emptyToNull(sender))
                .receiver(emptyToNull(receiver)).encrypted(encrypted).payloadLength(payloadLength)
                .checksumSha256(checksum).payload(payload).build();
    }

    public static String checksum(byte[] data) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
            StringBuilder builder = new StringBuilder(64);
            for (byte value : digest) builder.append(String.format("%02x", value));
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }

    private static String nullable(String value) { return value == null ? "" : value; }
    private static String required(String value) { return value == null ? java.util.UUID.randomUUID().toString() : value; }
    private static String emptyToNull(String value) { return value.isEmpty() ? null : value; }
}
