package com.lansphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkStatusResponse {
    private String status;           // OPTIMAL, DEGRADED, OFFLINE
    private double latencyMs;
    private double packetLossPercent;
    private double bandwidthUsageMbps;
    private double maxBandwidthMbps;
    private double transferSpeedMbps;
    private String localIpAddress;
    private String subnetMask;
    private String gateway;
    private String macAddress;
    private String hostname;
    private int activePeersCount;
    private int totalTransfersToday;
    private List<NodePeerInfo> discoveredPeers;
    private long packetsSent;
    private long packetsReceived;
    private long discoveryPackets;
    private long heartbeatPackets;
    private long connectionUptimeSeconds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodePeerInfo {
        private String nodeId;
        private String username;
        private String ipAddress;
        private String macAddress;
        private String hostname;
        private double pingMs;
        private String status;
    }
}
