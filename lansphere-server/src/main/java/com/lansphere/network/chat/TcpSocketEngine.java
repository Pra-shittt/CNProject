package com.lansphere.network.chat;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.NetworkProperties;
import com.lansphere.network.PacketType;
import com.lansphere.network.monitor.NetworkMetrics;
import com.lansphere.network.protocol.PacketCodec;
import com.lansphere.network.security.AesGcmCryptoSuite;
import com.lansphere.network.security.NetworkKeyProvider;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** TCP socket server with concurrent connections, delivery acknowledgements and bounded reconnect retries. */
@Component
public class TcpSocketEngine {
    private static final Logger log = LoggerFactory.getLogger(TcpSocketEngine.class);
    private final NetworkProperties properties; private final NetworkMetrics metrics;
    private final AesGcmCryptoSuite crypto; private final NetworkKeyProvider keys;
    private final Map<Byte, PacketHandler> handlers = new ConcurrentHashMap<>();
    private final Map<String, Long> processedPacketIds = new ConcurrentHashMap<>();
    private final ExecutorService workers = Executors.newFixedThreadPool(Math.max(4, Runtime.getRuntime().availableProcessors()), runnable -> new Thread(runnable, "lansphere-tcp-worker"));
    private final AtomicBoolean running = new AtomicBoolean();
    private ServerSocket server;

    public TcpSocketEngine(NetworkProperties properties, NetworkMetrics metrics, AesGcmCryptoSuite crypto, NetworkKeyProvider keys) {
        this.properties = properties; this.metrics = metrics; this.crypto = crypto; this.keys = keys;
    }
    @PostConstruct public void start() {
        if (!properties.isEnabled() || !running.compareAndSet(false, true)) return;
        workers.execute(() -> {
            try (ServerSocket socket = new ServerSocket(properties.getTcpPort())) {
                server = socket;
                log.info("TCP networking engine listening on port {}", properties.getTcpPort());
                while (running.get()) { Socket client = socket.accept(); workers.execute(() -> handle(client)); }
            } catch (Exception exception) { if (running.get()) log.error("TCP networking engine stopped: {}", exception.getMessage()); running.set(false); }
        });
    }
    public void register(PacketType type, PacketHandler handler) { handlers.put(type.getCode(), handler); }
    public boolean isRunning() { return running.get() && server != null && !server.isClosed(); }
    public CompletableFuture<Boolean> send(String address, int port, LanSpherePacket packet) {
        return CompletableFuture.supplyAsync(() -> sendWithRetry(address, port, packet), workers);
    }
    private boolean sendWithRetry(String address, int port, LanSpherePacket packet) {
        for (int attempt = 0; attempt < 2; attempt++) {
            long startedAt = System.nanoTime();
            try (Socket socket = new Socket()) {
                socket.connect(new java.net.InetSocketAddress(address, port), properties.getSocketTimeoutMs());
                socket.setSoTimeout(properties.getSocketTimeoutMs());
                LanSpherePacket protectedPacket = protect(packet);
                DataOutputStream output = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
                PacketCodec.write(output, protectedPacket);
                DataInputStream input = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
                LanSpherePacket acknowledgement = PacketCodec.read(input);
                boolean accepted = acknowledgement.getPacketType() == PacketType.ACK && new String(acknowledgement.getPayload(), StandardCharsets.UTF_8).equals(packet.getPacketId());
                if (accepted) { metrics.sent(packet.getPayload() == null ? 0 : packet.getPayload().length); metrics.recordRtt((System.nanoTime() - startedAt) / 1_000_000.0); return true; }
            } catch (Exception exception) {
                if (attempt == 1) log.debug("Packet {} could not reach {}:{}: {}", packet.getPacketId(), address, port, exception.getMessage());
                try { Thread.sleep(100L * (attempt + 1)); } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); return false; }
            }
        }
        metrics.failed(); return false;
    }
    private void handle(Socket socket) {
        try (socket; DataInputStream input = new DataInputStream(new BufferedInputStream(socket.getInputStream())); DataOutputStream output = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()))) {
            LanSpherePacket packet = unprotect(PacketCodec.read(input));
            boolean duplicate = processedPacketIds.putIfAbsent(packet.getPacketId(), System.currentTimeMillis()) != null;
            if (!duplicate) {
                PacketHandler handler = handlers.get(packet.getOpcode());
                if (handler != null) handler.handle(packet, socket.getInetAddress().getHostAddress());
                metrics.received(packet.getPayload() == null ? 0 : packet.getPayload().length);
            }
            sendAck(output, packet.getPacketId());
            processedPacketIds.entrySet().removeIf(entry -> entry.getValue() < System.currentTimeMillis() - 300_000);
        } catch (Exception exception) { metrics.failed(); log.debug("Rejected TCP packet: {}", exception.getMessage()); }
    }
    private LanSpherePacket protect(LanSpherePacket packet) {
        PacketType type = packet.getPacketType();
        if (type == PacketType.CHAT || type == PacketType.FILE || type == PacketType.SCREEN) {
            packet.setPayload(crypto.encrypt(packet.getPayload() == null ? new byte[0] : packet.getPayload(), keys.getKey())); packet.setEncrypted(true);
        }
        return packet;
    }
    private LanSpherePacket unprotect(LanSpherePacket packet) { if (packet.isEncrypted()) { packet.setPayload(crypto.decrypt(packet.getPayload(), keys.getKey())); packet.setEncrypted(false); } return packet; }
    private void sendAck(DataOutputStream output, String packetId) throws Exception {
        LanSpherePacket acknowledgement = LanSpherePacket.builder().opcode(PacketType.ACK.getCode()).payload(packetId.getBytes(StandardCharsets.UTF_8)).build();
        PacketCodec.write(output, acknowledgement);
    }
    @PreDestroy public void stop() { running.set(false); try { if (server != null) server.close(); } catch (Exception ignored) { } workers.shutdownNow(); }
}
