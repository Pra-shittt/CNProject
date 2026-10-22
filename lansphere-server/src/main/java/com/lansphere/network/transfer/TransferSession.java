package com.lansphere.network.transfer;

import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicLong;

/** Tracks one resumable incoming or outgoing file stream. */
public final class TransferSession {
    private final String id; private final Path path; private final long totalBytes; private final String checksum;
    private final AtomicLong transferred = new AtomicLong(); private volatile boolean cancelled;
    public TransferSession(String id, Path path, long totalBytes, String checksum) { this.id = id; this.path = path; this.totalBytes = totalBytes; this.checksum = checksum; }
    public String getId() { return id; } public Path getPath() { return path; } public long getTotalBytes() { return totalBytes; }
    public String getChecksum() { return checksum; } public long getTransferred() { return transferred.get(); }
    public void advance(long bytes) { transferred.addAndGet(bytes); } public boolean isCancelled() { return cancelled; } public void cancel() { cancelled = true; }
}
