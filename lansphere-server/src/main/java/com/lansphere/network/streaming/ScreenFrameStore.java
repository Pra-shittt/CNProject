package com.lansphere.network.streaming;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Keeps the latest received frame for each peer for a UI adapter to consume. */
@Component
public class ScreenFrameStore {
    private final ConcurrentHashMap<String, byte[]> frames = new ConcurrentHashMap<>();
    public void put(String peerId, byte[] jpeg) { frames.put(peerId, jpeg); }
    public byte[] get(String peerId) { return frames.get(peerId); }
    public void remove(String peerId) { frames.remove(peerId); }
}
