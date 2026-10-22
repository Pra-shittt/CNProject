package com.lansphere.network.heartbeat;

import com.lansphere.network.NetworkProperties;
import com.lansphere.network.Peer;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.discovery.UdpPeerDiscoveryService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/** Announces peer liveness independently of discovery and removes timed-out nodes. */
@Component
public class HeartbeatService {
    private final NetworkProperties properties; private final PeerRegistry peers; private final UdpPeerDiscoveryService discovery;
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor(runnable -> new Thread(runnable, "lansphere-heartbeat"));
    public HeartbeatService(NetworkProperties properties, PeerRegistry peers, UdpPeerDiscoveryService discovery) { this.properties = properties; this.peers = peers; this.discovery = discovery; }
    @PostConstruct public void start() {
        if (!properties.isEnabled()) return;
        executor.scheduleWithFixedDelay(this::beat, properties.getHeartbeatIntervalMs(), properties.getHeartbeatIntervalMs(), TimeUnit.MILLISECONDS);
        executor.scheduleWithFixedDelay(() -> peers.expireOlderThan(Instant.now().toEpochMilli() - properties.getHeartbeatTimeoutMs()), properties.getHeartbeatTimeoutMs(), properties.getHeartbeatIntervalMs(), TimeUnit.MILLISECONDS);
    }
    private void beat() { for (Peer peer : peers.all()) discovery.sendHeartbeat(peer.getIpAddress()); }
    public boolean isAlive(String nodeId) { Peer peer = peers.get(nodeId); return peer != null && peer.getLastSeen() >= Instant.now().toEpochMilli() - properties.getHeartbeatTimeoutMs(); }
    @PreDestroy public void stop() { executor.shutdownNow(); }
}
