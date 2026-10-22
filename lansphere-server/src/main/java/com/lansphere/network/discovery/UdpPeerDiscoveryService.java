package com.lansphere.network.discovery;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.NetworkProperties;
import com.lansphere.network.NodeIdentity;
import com.lansphere.network.PacketType;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.monitor.NetworkMetrics;
import com.lansphere.network.protocol.PacketCodec;
import com.lansphere.util.NetworkUtil;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Performs UDP broadcast discovery and accepts unicast discovery replies on a listener thread. */
@Component
public class UdpPeerDiscoveryService {
    private static final Logger log = LoggerFactory.getLogger(UdpPeerDiscoveryService.class);
    private final NetworkProperties properties;
    private final NodeIdentity identity;
    private final PeerRegistry peers;
    private final NetworkMetrics metrics;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2, runnable -> new Thread(runnable, "lansphere-discovery"));
    private final AtomicBoolean running = new AtomicBoolean();
    private DatagramSocket socket;

    public UdpPeerDiscoveryService(NetworkProperties properties, NodeIdentity identity, PeerRegistry peers, NetworkMetrics metrics) {
        this.properties = properties; this.identity = identity; this.peers = peers; this.metrics = metrics;
    }

    @PostConstruct
    public void start() {
        if (!properties.isEnabled() || !running.compareAndSet(false, true)) return;
        try {
            socket = new DatagramSocket(null);
            socket.setReuseAddress(true);
            socket.setBroadcast(true);
            socket.setSoTimeout(1000);
            socket.bind(new InetSocketAddress(properties.getDiscoveryPort()));
            scheduler.execute(this::listen);
            scheduler.scheduleWithFixedDelay(this::broadcastDiscovery, 300, properties.getDiscoveryIntervalMs(), TimeUnit.MILLISECONDS);
            log.info("UDP discovery listening on port {}", properties.getDiscoveryPort());
        } catch (Exception exception) {
            running.set(false);
            log.warn("UDP discovery is unavailable: {}", exception.getMessage());
        }
    }

    public void broadcastDiscovery() { send(PacketType.DISCOVERY, InetAddress.getLoopbackAddress()); send(PacketType.DISCOVERY, broadcastAddress()); }
    public void sendHeartbeat(String address) { try { send(PacketType.HEARTBEAT, InetAddress.getByName(address)); } catch (Exception ignored) { } }

    private void listen() {
        byte[] buffer = new byte[PacketCodec.MAX_PAYLOAD_BYTES > 65535 ? 65535 : PacketCodec.MAX_PAYLOAD_BYTES];
        while (running.get()) {
            try {
                DatagramPacket datagram = new DatagramPacket(buffer, buffer.length);
                socket.receive(datagram);
                handle(datagram);
            } catch (java.net.SocketTimeoutException ignored) {
            } catch (SocketException exception) {
                if (running.get()) log.warn("UDP discovery socket closed unexpectedly: {}", exception.getMessage());
            } catch (Exception exception) { log.debug("Ignoring malformed discovery datagram: {}", exception.getMessage()); }
        }
    }

    private void handle(DatagramPacket datagram) throws Exception {
        LanSpherePacket packet = PacketCodec.read(new DataInputStream(new ByteArrayInputStream(datagram.getData(), datagram.getOffset(), datagram.getLength())));
        if (identity.getNodeId().equals(packet.getSender())) return;
        if (packet.getPacketType() != PacketType.DISCOVERY && packet.getPacketType() != PacketType.DISCOVERY_REPLY && packet.getPacketType() != PacketType.HEARTBEAT) return;
        String[] details = new String(packet.getPayload(), StandardCharsets.UTF_8).split("\\|", 3);
        if (details.length != 3) return;
        peers.upsert(packet.getSender(), details[1], datagram.getAddress().getHostAddress(), Integer.parseInt(details[2]));
        metrics.received(datagram.getLength());
        if (packet.getPacketType() == PacketType.DISCOVERY) send(PacketType.DISCOVERY_REPLY, datagram.getAddress());
        if (packet.getPacketType() == PacketType.HEARTBEAT) metrics.heartbeat();
    }

    private void send(PacketType type, InetAddress target) {
        if (!running.get() || socket == null) return;
        try {
            byte[] payload = (identity.getNodeId() + "|" + identity.getHostname() + "|" + properties.getTcpPort()).getBytes(StandardCharsets.UTF_8);
            LanSpherePacket packet = LanSpherePacket.builder().opcode(type.getCode()).sender(identity.getNodeId()).senderNodeId(identity.getNumericId()).payload(payload).build();
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            PacketCodec.write(new DataOutputStream(bytes), packet);
            byte[] data = bytes.toByteArray();
            socket.send(new DatagramPacket(data, data.length, target, properties.getDiscoveryPort()));
            metrics.sent(data.length); metrics.discovery();
        } catch (Exception exception) { log.debug("Could not send {} packet: {}", type, exception.getMessage()); }
    }

    private InetAddress broadcastAddress() {
        try { return InetAddress.getByName("255.255.255.255"); }
        catch (Exception exception) { return InetAddress.getLoopbackAddress(); }
    }

    @PreDestroy
    public void stop() { running.set(false); scheduler.shutdownNow(); if (socket != null) socket.close(); }
}
