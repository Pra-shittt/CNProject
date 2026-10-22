import React from 'react';
import {
  Radio,
  Network,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const futureModules = [
    { id: 1, name: 'UDP Broadcast Peer Discovery', desc: 'Zero-configuration subnet beaconing and ARP listening on UDP multicast groups.' },
    { id: 2, name: 'TCP Socket Messaging', desc: 'Low-latency direct peer-to-peer TCP stream pipelines bypassing intermediaries.' },
    { id: 3, name: 'Reliable File Transfer over TCP', desc: 'Sliding window chunked byte stream transfer with automatic retransmission.' },
    { id: 4, name: 'Screen Sharing', desc: 'Real-time LAN desktop video frame streaming over multicast transport.' },
    { id: 5, name: 'AES Encryption', desc: 'End-to-end 256-bit AES-GCM local payload encryption with Diffie-Hellman key exchange.' },
    { id: 6, name: 'Network Analytics', desc: 'Dynamic packet jitter, bandwidth saturation, and subnet topology visualization.' },
    { id: 7, name: 'Presence Detection', desc: 'Passive subnet packet sniffing and active ICMP echo requests for device discovery.' },
    { id: 8, name: 'Heartbeat Monitoring', desc: 'High-frequency keep-alive ping cycles with automatic dead-peer pruning.' },
    { id: 9, name: 'Application Layer Packet Protocol', desc: 'Binary frame protocol with 2-byte magic headers, opcodes, and SHA-256 checksums.' },
    { id: 10, name: 'Transfer Resume', desc: 'Byte-offset checkpointing allowing interrupted file transfers to resume seamlessly.' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Brand Hero Card */}
      <div className="glass-panel rounded-3xl p-8 border border-border/70 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 flex-shrink-0">
            <Radio className="w-10 h-10 animate-pulse-subtle" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">LanSphere</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                v1.0.0
              </span>
            </div>
            <p className="text-sm font-semibold text-indigo-400 mt-1">
              Redefining Local Network Collaboration
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">
              LanSphere is a high-performance LAN collaboration platform enabling computers connected to the same Local Area Network to communicate and collaborate securely without relying on external internet services.
            </p>
          </div>
        </div>
      </div>

      {/* Computer Networks Concepts Section */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-lg">Computer Networks Concepts Demonstrated</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Layer 2 & 3 Physical Topologies</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Detects local host NIC adapters, hardware MAC identifiers, IPv4 subnet masks, and default gateways for localized routing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Full-Duplex WebSocket Broker</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Low-latency STOMP messaging protocol operating over TCP sockets with broadcast topic and private user queue routing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Cryptographic Integrity Verification</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              SHA-256 byte-stream hashing computed in real-time during file uploads to ensure error-free transmission across the wire.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Subnet Latency & Telemetry Probing</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Measures round-trip ICMP/TCP ping response times, packet loss probability, and bandwidth utilization on Gigabit LAN backbones.
            </p>
          </div>
        </div>
      </div>

      {/* Networking Roadmap (10 Future Modules) */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
          <GitBranch className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="font-bold text-lg">Architectural Networking Roadmap</h2>
            <p className="text-xs text-muted-foreground">Contracts & interfaces already prepared in core backend</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {futureModules.map((mod) => (
            <div key={mod.id} className="p-3.5 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center justify-center flex-shrink-0 text-xs">
                {mod.id}
              </span>
              <div>
                <h4 className="font-bold text-foreground">{mod.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Specifications */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-3">
        <h2 className="font-bold text-base">Technology Stack Summary</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            'Java 21', 'Spring Boot 3', 'Spring WebSocket', 'Spring Security', 'SQLite',
            'React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'Zustand', 'Axios', 'Lucide'
          ].map((tech) => (
            <span key={tech} className="px-3 py-1.5 rounded-xl bg-card border border-border/60 font-semibold text-foreground">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
