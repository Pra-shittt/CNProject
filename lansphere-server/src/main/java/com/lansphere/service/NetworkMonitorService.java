package com.lansphere.service;

import com.lansphere.dto.response.NetworkStatusResponse;
import com.lansphere.network.Peer;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.monitor.NetworkMetrics;
import com.lansphere.network.chat.TcpSocketEngine;
import com.lansphere.repository.FileTransferRepository;
import com.lansphere.util.NetworkUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NetworkMonitorService {

    private final FileTransferRepository fileTransferRepository;
    private final PeerRegistry peerRegistry;
    private final NetworkMetrics metrics;
    private final TcpSocketEngine tcpSocketEngine;

    public NetworkStatusResponse getCurrentNetworkStatus() {
        String localIp = NetworkUtil.getLocalIpAddress();
        String mac = NetworkUtil.getLocalMacAddress();
        String host = NetworkUtil.getHostName();

        // Calculate subnet and gateway approximation
        String gateway = "192.168.1.1";
        if (localIp.contains(".")) {
            int lastDot = localIp.lastIndexOf('.');
            gateway = localIp.substring(0, lastDot) + ".1";
        }

        // Use observed LSAP latency, with a local reachability check as a fallback.
        double pingMs = measurePing("127.0.0.1");
        if (metrics.getRttMs() > 0) pingMs = metrics.getRttMs();
        if (pingMs < 0) pingMs = 0;
        long attempted = metrics.getPacketsSent() + metrics.getPacketsReceived() + metrics.getFailedPackets();
        double packetLoss = attempted == 0 ? 0 : (metrics.getFailedPackets() * 100.0 / attempted);
        double maxBandwidth = 1000.0;
        double currentBandwidth = metrics.getBytesSent() * 8.0 / 1_000_000.0;
        double transferSpeed = currentBandwidth;

        List<NetworkStatusResponse.NodePeerInfo> peers = new ArrayList<>();
        for (Peer u : peerRegistry.all()) {
            peers.add(NetworkStatusResponse.NodePeerInfo.builder()
                    .nodeId(u.getNodeId())
                    .username(u.getHostname())
                    .ipAddress(u.getIpAddress())
                    .macAddress("LAN peer")
                    .hostname(u.getHostname())
                    .pingMs(u.getLastRttMs())
                    .status("ONLINE")
                    .build());
        }

        String status = tcpSocketEngine.isRunning() ? "OPTIMAL" : "OFFLINE";
        if (tcpSocketEngine.isRunning() && (packetLoss > 1.5 || pingMs > 50)) {
            status = "DEGRADED";
        }

        return NetworkStatusResponse.builder()
                .status(status)
                .latencyMs(Math.round(pingMs * 100.0) / 100.0)
                .packetLossPercent(Math.round(packetLoss * 100.0) / 100.0)
                .bandwidthUsageMbps(Math.round(currentBandwidth * 10.0) / 10.0)
                .maxBandwidthMbps(maxBandwidth)
                .transferSpeedMbps(Math.round(transferSpeed * 10.0) / 10.0)
                .localIpAddress(localIp)
                .subnetMask("255.255.255.0")
                .gateway(gateway)
                .macAddress(mac)
                .hostname(host)
                .activePeersCount(peers.size())
                .totalTransfersToday((int) fileTransferRepository.count())
                .discoveredPeers(peers)
                .packetsSent(metrics.getPacketsSent())
                .packetsReceived(metrics.getPacketsReceived())
                .discoveryPackets(metrics.getDiscoveryPackets())
                .heartbeatPackets(metrics.getHeartbeats())
                .connectionUptimeSeconds(metrics.getConnectionUptimeSeconds())
                .build();
    }

    private double measurePing(String host) {
        try {
            long start = System.nanoTime();
            boolean reachable = InetAddress.getByName(host).isReachable(500);
            long end = System.nanoTime();
            if (reachable) {
                return (end - start) / 1_000_000.0;
            }
        } catch (Exception ignored) {}
        return -1;
    }
}
