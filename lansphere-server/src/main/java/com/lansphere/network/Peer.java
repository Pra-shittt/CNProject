package com.lansphere.network;

import java.time.Instant;

/** Mutable liveness record for a node announced by UDP discovery. */
public final class Peer {
    private final String nodeId;
    private final String hostname;
    private final String ipAddress;
    private final int tcpPort;
    private volatile long lastSeen;
    private volatile long lastRttMs;

    public Peer(String nodeId, String hostname, String ipAddress, int tcpPort) {
        this.nodeId = nodeId; this.hostname = hostname; this.ipAddress = ipAddress; this.tcpPort = tcpPort;
        this.lastSeen = Instant.now().toEpochMilli();
    }
    public void heartbeat() { lastSeen = Instant.now().toEpochMilli(); }
    public String getNodeId() { return nodeId; } public String getHostname() { return hostname; }
    public String getIpAddress() { return ipAddress; } public int getTcpPort() { return tcpPort; }
    public long getLastSeen() { return lastSeen; } public long getLastRttMs() { return lastRttMs; }
    public void setLastRttMs(long value) { lastRttMs = value; }
}
