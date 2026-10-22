package com.lansphere.network.transfer;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.NodeIdentity;
import com.lansphere.network.PacketType;
import com.lansphere.network.Peer;
import com.lansphere.network.chat.TcpSocketEngine;
import com.lansphere.network.protocol.PacketCodec;
import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.stereotype.Service;
import com.lansphere.network.NetworkProperties;

/** Implements chunked TCP file delivery with ordered offsets, cancellation and resumable receiver state. */
@Service
public class ReliableFileTransferService {
    private static final byte START = 1, CHUNK = 2, FINISH = 3, CANCEL = 4;
    private final TcpSocketEngine tcp; private final NodeIdentity identity; private final NetworkProperties properties;
    private final Map<String, TransferSession> sessions = new ConcurrentHashMap<>();
    private final ExecutorService queue = Executors.newSingleThreadExecutor(runnable -> new Thread(runnable, "lansphere-file-transfer"));
    public ReliableFileTransferService(TcpSocketEngine tcp, NodeIdentity identity, NetworkProperties properties) { this.tcp = tcp; this.identity = identity; this.properties = properties; }
    @PostConstruct public void initialize() { tcp.register(PacketType.FILE, this::receive); }
    public CompletableFuture<String> transfer(Peer peer, Path source) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String transferId = UUID.randomUUID().toString(); long size = Files.size(source); String checksum = checksum(source);
                TransferSession session = new TransferSession(transferId, source, size, checksum); sessions.put(transferId, session);
                if (!send(peer, envelope(START, transferId, source.getFileName().toString(), 0, size, checksum, new byte[0]))) throw new IOException("Recipient did not acknowledge transfer start");
                byte[] buffer = new byte[properties.getTransferChunkSize()]; long offset = 0;
                try (var input = Files.newInputStream(source)) {
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (session.isCancelled()) { send(peer, envelope(CANCEL, transferId, "", offset, size, checksum, new byte[0])); throw new IOException("Transfer cancelled"); }
                        byte[] part = java.util.Arrays.copyOf(buffer, count);
                        if (!send(peer, envelope(CHUNK, transferId, "", offset, size, checksum, part))) throw new IOException("Chunk acknowledgement failed at offset " + offset);
                        offset += count; session.advance(count);
                    }
                }
                if (!send(peer, envelope(FINISH, transferId, "", offset, size, checksum, new byte[0]))) throw new IOException("Recipient did not acknowledge transfer completion");
                return transferId;
            } catch (Exception exception) { throw new IllegalStateException("File transfer failed", exception); }
        }, queue);
    }
    public long resumeOffset(String transferId) { TransferSession session = sessions.get(transferId); return session == null ? 0 : session.getTransferred(); }
    public void cancel(String transferId) { TransferSession session = sessions.get(transferId); if (session != null) session.cancel(); }
    /** Continues an interrupted sender session from the last acknowledged chunk. */
    public CompletableFuture<String> resume(Peer peer, String transferId) {
        return CompletableFuture.supplyAsync(() -> {
            TransferSession session = sessions.get(transferId);
            if (session == null) throw new IllegalArgumentException("Unknown transfer id");
            try {
                long offset = session.getTransferred(); byte[] buffer = new byte[properties.getTransferChunkSize()];
                try (var input = Files.newInputStream(session.getPath())) {
                    input.skipNBytes(offset); int count;
                    while ((count = input.read(buffer)) != -1) {
                        byte[] part = java.util.Arrays.copyOf(buffer, count);
                        if (!send(peer, envelope(CHUNK, transferId, "", offset, session.getTotalBytes(), session.getChecksum(), part))) throw new IOException("Chunk acknowledgement failed at offset " + offset);
                        offset += count; session.advance(count);
                    }
                }
                if (!send(peer, envelope(FINISH, transferId, "", offset, session.getTotalBytes(), session.getChecksum(), new byte[0]))) throw new IOException("Recipient did not acknowledge transfer completion");
                return transferId;
            } catch (Exception exception) { throw new IllegalStateException("Transfer resume failed", exception); }
        }, queue);
    }
    private boolean send(Peer peer, byte[] payload) {
        LanSpherePacket packet = LanSpherePacket.builder().opcode(PacketType.FILE.getCode()).sender(identity.getNodeId()).senderNodeId(identity.getNumericId()).payload(payload).build();
        return tcp.send(peer.getIpAddress(), peer.getTcpPort(), packet).join();
    }
    private byte[] envelope(byte action, String id, String name, long offset, long total, String checksum, byte[] data) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (DataOutputStream output = new DataOutputStream(bytes)) { output.writeByte(action); output.writeUTF(id); output.writeUTF(name); output.writeLong(offset); output.writeLong(total); output.writeUTF(checksum); output.writeInt(data.length); output.write(data); }
        return bytes.toByteArray();
    }
    private void receive(LanSpherePacket packet, String source) {
        try (DataInputStream input = new DataInputStream(new ByteArrayInputStream(packet.getPayload()))) {
            byte action = input.readByte(); String id = input.readUTF(); String name = input.readUTF(); long offset = input.readLong(); long total = input.readLong(); String checksum = input.readUTF(); int dataLength = input.readInt();
            if (dataLength < 0 || dataLength > properties.getTransferChunkSize()) throw new IOException("Invalid file chunk length");
            byte[] data = input.readNBytes(dataLength);
            if (action == START) {
                Path directory = Path.of(properties.getTransferDirectory()).toAbsolutePath().normalize(); Files.createDirectories(directory);
                Path target = directory.resolve(Path.of(name).getFileName().toString());
                TransferSession session = new TransferSession(id, target, total, checksum); sessions.put(id, session);
                if (!Files.exists(target)) Files.createFile(target); else session.advance(Files.size(target));
            } else if (action == CHUNK) {
                TransferSession session = required(id);
                if (session.isCancelled() || offset != session.getTransferred()) throw new IOException("Unexpected file chunk offset");
                Files.write(session.getPath(), data, StandardOpenOption.APPEND); session.advance(data.length);
            } else if (action == FINISH) {
                TransferSession session = required(id);
                if (session.getTransferred() != session.getTotalBytes() || !checksum(session.getPath()).equals(session.getChecksum())) throw new IOException("File integrity verification failed");
            } else if (action == CANCEL) required(id).cancel();
        } catch (Exception exception) { throw new IllegalArgumentException("Invalid file transfer packet from " + source, exception); }
    }
    private TransferSession required(String id) throws IOException { TransferSession session = sessions.get(id); if (session == null) throw new IOException("Unknown transfer id"); return session; }
    private String checksum(Path source) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (var input = Files.newInputStream(source)) { byte[] buffer = new byte[8192]; int count; while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count); }
        StringBuilder value = new StringBuilder(64); for (byte item : digest.digest()) value.append(String.format("%02x", item)); return value.toString();
    }
}
