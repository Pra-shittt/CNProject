package com.lansphere.network.chat;

import com.lansphere.network.PacketType;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import com.lansphere.service.ChatService;

/** Connects validated TCP chat packets to the existing persistence service on the receiving node. */
@Component
public class NetworkChatRelay {
    private final TcpSocketEngine tcp; private final ChatService chats;
    public NetworkChatRelay(TcpSocketEngine tcp, ChatService chats) { this.tcp = tcp; this.chats = chats; }
    @PostConstruct public void initialize() {
        tcp.register(PacketType.CHAT, (packet, source) ->
                chats.receiveNetworkMessage(packet.getSender(), packet.getReceiver(), packet.getPayload()));
    }
}
