package com.lansphere.network;

import com.lansphere.util.NetworkUtil;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Supplies a stable deterministic node id for the machine hosting this instance. */
@Component
public class NodeIdentity {
    private final String nodeId;
    private final long numericId;
    private final String hostname;

    public NodeIdentity() {
        hostname = NetworkUtil.getHostName();
        nodeId = UUID.nameUUIDFromBytes((hostname + ':' + NetworkUtil.getLocalMacAddress()).getBytes(StandardCharsets.UTF_8)).toString();
        numericId = UUID.fromString(nodeId).getMostSignificantBits();
    }
    public String getNodeId() { return nodeId; }
    public long getNumericId() { return numericId; }
    public String getHostname() { return hostname; }
}
