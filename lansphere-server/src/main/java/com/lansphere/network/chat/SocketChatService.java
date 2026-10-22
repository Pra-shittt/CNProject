package com.lansphere.network.chat;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.NodeIdentity;
import com.lansphere.network.PacketType;
import com.lansphere.network.Peer;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Service;

/** Sends private or group chat envelopes over the TCP engine without involving WebSocket transport. */
@Service
public class SocketChatService {
    private final TcpSocketEngine tcp; private final NodeIdentity identity;
    public SocketChatService(TcpSocketEngine tcp, NodeIdentity identity) { this.tcp = tcp; this.identity = identity; }
    public CompletableFuture<Boolean> send(Peer peer, String sender, String receiver, String message) {
        LanSpherePacket packet = LanSpherePacket.builder().opcode(PacketType.CHAT.getCode()).sender(sender).receiver(receiver)
                .senderNodeId(identity.getNumericId()).payload(message.getBytes(StandardCharsets.UTF_8)).build();
        return tcp.send(peer.getIpAddress(), peer.getTcpPort(), packet);
    }
}
