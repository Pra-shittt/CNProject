package com.lansphere.controller;

import com.lansphere.dto.response.ApiResponse;
import com.lansphere.exception.ResourceNotFoundException;
import com.lansphere.network.Peer;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.streaming.ScreenFrameStore;
import com.lansphere.network.streaming.ScreenStreamingService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Exposes safe REST adapters for discovered-peer inspection and screen-view controls. */
@RestController
@RequestMapping("/network")
@RequiredArgsConstructor
public class NetworkEngineController {
    private final PeerRegistry peers;
    private final ScreenStreamingService screenStreaming;
    private final ScreenFrameStore frames;

    @GetMapping("/peers")
    public ResponseEntity<ApiResponse<List<Peer>>> getPeers() { return ResponseEntity.ok(ApiResponse.success(List.copyOf(peers.all()))); }

    @PostMapping("/screen/{nodeId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestScreen(@PathVariable String nodeId) {
        Peer peer = peer(nodeId); screenStreaming.requestView(peer);
        return ResponseEntity.ok(ApiResponse.success("Screen view requested", Map.of("nodeId", nodeId)));
    }

    @DeleteMapping("/screen/{nodeId}")
    public ResponseEntity<ApiResponse<Void>> stopScreen(@PathVariable String nodeId) {
        screenStreaming.stopView(peer(nodeId));
        return ResponseEntity.ok(ApiResponse.success("Screen view stopped", null));
    }

    @GetMapping(value = "/screen/{nodeId}/frame", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getFrame(@PathVariable String nodeId) {
        byte[] frame = frames.get(nodeId);
        return frame == null ? ResponseEntity.noContent().build() : ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(frame);
    }

    private Peer peer(String nodeId) { Peer peer = peers.get(nodeId); if (peer == null) throw new ResourceNotFoundException("Peer", "nodeId", nodeId); return peer; }
}
