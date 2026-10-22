package com.lansphere.network;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.CompletableFuture;

/**
 * Architectural Extension Contracts for the 10 Upcoming Networking Modules.
 * These interfaces establish clean injection points into LanSphere core.
 */
public interface NetworkEngineContracts {

    /** Module 1: UDP Broadcast Peer Discovery */
    interface PeerDiscoveryEngine {
        void startBroadcastDiscovery(int port, int intervalSeconds);
        void stopBroadcastDiscovery();
        void registerPeerListener(PeerDiscoveryListener listener);
    }

    interface PeerDiscoveryListener {
        void onPeerDiscovered(String nodeHostname, String ipAddress, int port);
        void onPeerLost(String ipAddress);
    }

    /** Module 2 & 9: TCP Socket Messaging & Application Layer Packet Protocol */
    interface DirectSocketEngine {
        CompletableFuture<Boolean> sendPacket(String targetIp, int port, LanSpherePacket packet);
        void registerPacketHandler(byte opcode, PacketHandler handler);
    }

    interface PacketHandler {
        void handlePacket(LanSpherePacket packet, String sourceIp);
    }

    /** Module 3 & 10: Reliable File Transfer over TCP & Transfer Resume */
    interface ChunkedTransferEngine {
        CompletableFuture<String> initiateTransfer(String targetIp, String fileChecksum, long totalBytes);
        void streamChunk(String transferId, long byteOffset, byte[] data);
        long getResumeOffset(String transferId);
    }

    /** Module 4: Screen Sharing */
    interface ScreenStreamingBridge {
        void startFrameCapture(int fps, int quality);
        void streamToSubnet(String multicastGroup);
        void stopCapture();
    }

    /** Module 5: AES Encryption */
    interface CryptoSuite {
        byte[] encrypt(byte[] plaintext, byte[] sharedSecretKey);
        byte[] decrypt(byte[] ciphertext, byte[] sharedSecretKey);
    }

    /** Module 7 & 8: Presence Detection & Heartbeat Monitoring */
    interface HeartbeatSupervisor {
        void sendHeartbeat(String targetIp);
        void onHeartbeatReceived(String peerIp, long timestamp);
        boolean isPeerAlive(String peerIp);
    }
}
