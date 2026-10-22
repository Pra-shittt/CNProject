package com.lansphere.network.monitor;

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/** Lock-free counters and rolling latency values used by the network dashboard. */
@Component
public class NetworkMetrics {
    private final long startedAt = System.currentTimeMillis();
    private final AtomicLong packetsSent = new AtomicLong();
    private final AtomicLong packetsReceived = new AtomicLong();
    private final AtomicLong bytesSent = new AtomicLong();
    private final AtomicLong bytesReceived = new AtomicLong();
    private final AtomicLong discoveryPackets = new AtomicLong();
    private final AtomicLong heartbeats = new AtomicLong();
    private final AtomicLong failedPackets = new AtomicLong();
    private volatile double rttMs;
    public void sent(long bytes) { packetsSent.incrementAndGet(); bytesSent.addAndGet(bytes); }
    public void received(long bytes) { packetsReceived.incrementAndGet(); bytesReceived.addAndGet(bytes); }
    public void discovery() { discoveryPackets.incrementAndGet(); }
    public void heartbeat() { heartbeats.incrementAndGet(); }
    public void failed() { failedPackets.incrementAndGet(); }
    public void recordRtt(double value) { rttMs = rttMs == 0 ? value : (rttMs * 0.8) + (value * 0.2); }
    public long getPacketsSent() { return packetsSent.get(); } public long getPacketsReceived() { return packetsReceived.get(); }
    public long getBytesSent() { return bytesSent.get(); } public long getBytesReceived() { return bytesReceived.get(); }
    public long getDiscoveryPackets() { return discoveryPackets.get(); } public long getHeartbeats() { return heartbeats.get(); }
    public long getFailedPackets() { return failedPackets.get(); } public double getRttMs() { return rttMs; }
    public long getConnectionUptimeSeconds() { return (System.currentTimeMillis() - startedAt) / 1000; }
}
