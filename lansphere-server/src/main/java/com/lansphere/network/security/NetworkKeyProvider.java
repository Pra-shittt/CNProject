package com.lansphere.network.security;

import com.lansphere.network.NetworkProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/** Derives the LAN's AES key from the configured shared secret without exposing it to packets. */
@Component
public class NetworkKeyProvider {
    private final SecretKey key;
    public NetworkKeyProvider(NetworkProperties properties) {
        try { key = new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(properties.getSharedSecret().getBytes(StandardCharsets.UTF_8)), "AES"); }
        catch (Exception exception) { throw new IllegalStateException("Unable to create network key", exception); }
    }
    public SecretKey getKey() { return key; }
}
