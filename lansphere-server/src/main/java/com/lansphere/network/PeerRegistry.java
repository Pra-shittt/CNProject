package com.lansphere.network;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;

/** Thread-safe source of truth for nodes currently visible on the LAN. */
@Component
public class PeerRegistry {
    private final ConcurrentHashMap<String, Peer> peers = new ConcurrentHashMap<>();
    private volatile Consumer<Peer> onPeerOnline = peer -> { };
    private volatile Consumer<Peer> onPeerOffline = peer -> { };

    public Peer upsert(String nodeId, String hostname, String address, int tcpPort) {
        boolean[] created = {false};
        Peer peer = peers.compute(nodeId, (ignored, existing) -> {
            if (existing != null) { existing.heartbeat(); return existing; }
            created[0] = true; return new Peer(nodeId, hostname, address, tcpPort);
        });
        if (created[0]) onPeerOnline.accept(peer);
        return peer;
    }
    public void heartbeat(String nodeId) { Peer peer = peers.get(nodeId); if (peer != null) peer.heartbeat(); }
    public Collection<Peer> all() { return List.copyOf(peers.values()); }
    public Peer get(String nodeId) { return peers.get(nodeId); }
    public void expireOlderThan(long epochMillis) {
        peers.forEach((id, peer) -> { if (peer.getLastSeen() < epochMillis && peers.remove(id, peer)) onPeerOffline.accept(peer); });
    }
    public void onPeerOnline(Consumer<Peer> callback) { onPeerOnline = callback; }
    public void onPeerOffline(Consumer<Peer> callback) { onPeerOffline = callback; }
}
