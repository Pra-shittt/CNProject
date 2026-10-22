package com.lansphere.network.streaming;

import com.lansphere.network.LanSpherePacket;
import com.lansphere.network.NodeIdentity;
import com.lansphere.network.PacketType;
import com.lansphere.network.Peer;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.chat.TcpSocketEngine;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Service;

/** Captures scaled JPEG frames with AWT and streams them over encrypted TCP packets. */
@Service
public class ScreenStreamingService {
    private static final byte REQUEST_START = 0, REQUEST_STOP = 1;
    private final TcpSocketEngine tcp; private final NodeIdentity identity; private final ScreenFrameStore frames; private final PeerRegistry peers;
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1, runnable -> new Thread(runnable, "lansphere-screen-stream"));
    private final Map<String, ScheduledFuture<?>> streams = new ConcurrentHashMap<>();
    public ScreenStreamingService(TcpSocketEngine tcp, NodeIdentity identity, ScreenFrameStore frames, PeerRegistry peers) { this.tcp = tcp; this.identity = identity; this.frames = frames; this.peers = peers; }
    @jakarta.annotation.PostConstruct public void initialize() {
        tcp.register(PacketType.SCREEN, (packet, source) -> {
            byte[] payload = packet.getPayload();
            if (payload.length == 1 && payload[0] == REQUEST_START) { Peer requester = peers.get(packet.getSender()); if (requester != null) start(requester, 10, 1280, 0.65f); }
            else if (payload.length == 1 && payload[0] == REQUEST_STOP) stop(packet.getSender());
            else frames.put(packet.getSender(), payload);
        });
    }
    /** Asks a discovered node to start streaming its desktop back to this node. */
    public void requestView(Peer peer) { control(peer, REQUEST_START); }
    /** Asks a discovered node to stop the stream that it sends to this node. */
    public void stopView(Peer peer) { control(peer, REQUEST_STOP); frames.remove(peer.getNodeId()); }
    public void start(Peer peer, int fps, int maxWidth, float quality) {
        if (GraphicsEnvironment.isHeadless()) throw new IllegalStateException("Screen sharing requires a graphical desktop");
        stop(peer.getNodeId());
        int boundedFps = Math.max(1, Math.min(30, fps)); float boundedQuality = Math.max(0.1f, Math.min(0.95f, quality));
        streams.put(peer.getNodeId(), executor.scheduleAtFixedRate(() -> sendFrame(peer, maxWidth, boundedQuality), 0, 1000L / boundedFps, TimeUnit.MILLISECONDS));
    }
    public void stop(String peerId) { ScheduledFuture<?> stream = streams.remove(peerId); if (stream != null) stream.cancel(true); }
    private void control(Peer peer, byte command) {
        LanSpherePacket packet = LanSpherePacket.builder().opcode(PacketType.SCREEN.getCode()).sender(identity.getNodeId()).senderNodeId(identity.getNumericId()).payload(new byte[]{command}).build();
        tcp.send(peer.getIpAddress(), peer.getTcpPort(), packet);
    }
    private void sendFrame(Peer peer, int maxWidth, float quality) {
        try {
            Rectangle area = new Rectangle(java.awt.Toolkit.getDefaultToolkit().getScreenSize());
            BufferedImage captured = new Robot().createScreenCapture(area);
            int targetWidth = Math.max(1, Math.min(maxWidth, captured.getWidth())); int targetHeight = captured.getHeight() * targetWidth / captured.getWidth();
            BufferedImage scaled = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = scaled.createGraphics(); graphics.drawImage(captured, 0, 0, targetWidth, targetHeight, null); graphics.dispose();
            LanSpherePacket packet = LanSpherePacket.builder().opcode(PacketType.SCREEN.getCode()).sender(identity.getNodeId()).senderNodeId(identity.getNumericId()).payload(toJpeg(scaled, quality)).build();
            tcp.send(peer.getIpAddress(), peer.getTcpPort(), packet);
        } catch (Exception ignored) { }
    }
    private byte[] toJpeg(BufferedImage image, float quality) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(); ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try (ImageOutputStream output = ImageIO.createImageOutputStream(bytes)) { writer.setOutput(output); ImageWriteParam params = writer.getDefaultWriteParam(); params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT); params.setCompressionQuality(quality); writer.write(null, new IIOImage(image, null, null), params); }
        finally { writer.dispose(); }
        return bytes.toByteArray();
    }
    @jakarta.annotation.PreDestroy public void close() { streams.values().forEach(stream -> stream.cancel(true)); executor.shutdownNow(); }
}
