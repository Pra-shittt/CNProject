package com.lansphere.network;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configurable ports, timing and payload limits for the local networking engine. */
@ConfigurationProperties(prefix = "app.network")
public class NetworkProperties {
    private boolean enabled = true;
    private int discoveryPort = 39393;
    private int tcpPort = 39394;
    private long discoveryIntervalMs = 5000;
    private long heartbeatIntervalMs = 3000;
    private long heartbeatTimeoutMs = 12000;
    private int socketTimeoutMs = 5000;
    private int transferChunkSize = 65536;
    private String transferDirectory = "./network-transfers";
    private String sharedSecret = "change-this-lansphere-network-secret";
    public boolean isEnabled() { return enabled; } public void setEnabled(boolean value) { enabled = value; }
    public int getDiscoveryPort() { return discoveryPort; } public void setDiscoveryPort(int value) { discoveryPort = value; }
    public int getTcpPort() { return tcpPort; } public void setTcpPort(int value) { tcpPort = value; }
    public long getDiscoveryIntervalMs() { return discoveryIntervalMs; } public void setDiscoveryIntervalMs(long value) { discoveryIntervalMs = value; }
    public long getHeartbeatIntervalMs() { return heartbeatIntervalMs; } public void setHeartbeatIntervalMs(long value) { heartbeatIntervalMs = value; }
    public long getHeartbeatTimeoutMs() { return heartbeatTimeoutMs; } public void setHeartbeatTimeoutMs(long value) { heartbeatTimeoutMs = value; }
    public int getSocketTimeoutMs() { return socketTimeoutMs; } public void setSocketTimeoutMs(int value) { socketTimeoutMs = value; }
    public int getTransferChunkSize() { return transferChunkSize; } public void setTransferChunkSize(int value) { transferChunkSize = value; }
    public String getTransferDirectory() { return transferDirectory; } public void setTransferDirectory(String value) { transferDirectory = value; }
    public String getSharedSecret() { return sharedSecret; } public void setSharedSecret(String value) { sharedSecret = value; }
}
