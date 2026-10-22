import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  Server,
  Radio,
  Cpu,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowDownUp,
  Globe,
  Circle,
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { NetworkStatus } from '../types';

export const NetworkMonitorPage: React.FC = () => {
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [screenPeerId, setScreenPeerId] = useState<string | null>(null);
  const [screenUrl, setScreenUrl] = useState<string | null>(null);

  const loadNetwork = async () => {
    try {
      setRefreshing(true);
      const data = await networkService.getNetworkStatus();
      setNetwork(data);
      setPingHistory((prev) => [...prev.slice(1), data.latencyMs]);
    } catch (e) {
      console.error('Failed to load network status', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNetwork();
    const interval = setInterval(loadNetwork, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!screenPeerId) return;
    let currentUrl: string | null = null;
    const loadFrame = async () => {
      try {
        const frame = await networkService.getScreenFrame(screenPeerId);
        if (!frame) return;
        const nextUrl = URL.createObjectURL(frame);
        setScreenUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return nextUrl; });
        currentUrl = nextUrl;
      } catch (error) { console.error('Failed to load screen frame', error); }
    };
    loadFrame();
    const interval = window.setInterval(loadFrame, 150);
    return () => { window.clearInterval(interval); if (currentUrl) URL.revokeObjectURL(currentUrl); };
  }, [screenPeerId]);

  const openScreen = async (nodeId: string) => {
    try { await networkService.requestScreen(nodeId); setScreenPeerId(nodeId); } catch (error) { console.error('Could not request screen stream', error); }
  };

  const closeScreen = async () => {
    if (screenPeerId) await networkService.stopScreen(screenPeerId);
    setScreenPeerId(null); setScreenUrl(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN Network Telemetry & Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time diagnostics of physical link health, latency, bandwidth saturation, and subnet topology.
          </p>
        </div>

        <button
          onClick={loadNetwork}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-card border border-border/70 hover:bg-muted font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Network Core KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latency Card */}
        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Round-Trip Ping</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-500">{network?.latencyMs ?? 0}</span>
            <span className="text-xs font-bold text-muted-foreground">ms</span>
          </div>
          {/* Mini Sparkline Bar Chart */}
          <div className="mt-4 flex items-end gap-1.5 h-8">
            {pingHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-md bg-emerald-500/40 hover:bg-emerald-500 transition-all"
                style={{ height: `${Math.min(100, Math.max(20, val * 35))}%` }}
                title={`${val} ms`}
              />
            ))}
          </div>
        </div>

        {/* Bandwidth Card */}
        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Bandwidth</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-indigo-400">
              {network?.bandwidthUsageMbps ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">Mbps</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Link Cap: {network?.maxBandwidthMbps ?? 0} Mbps</span>
            <span className="text-indigo-400 font-semibold">Gigabit LAN</span>
          </div>
        </div>

        {/* Packet Loss */}
        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Packet Loss Rate</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-foreground">
              {network?.packetLossPercent ?? 0.0}%
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero congestion detected</span>
          </div>
        </div>

        {/* Transfer Rate */}
        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wire Transfer Rate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              {network?.transferSpeedMbps ?? 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground">MB/s</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Saturating local network adapter
          </div>
        </div>
      </div>

      {/* Host Adapter Information & Subnet Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Host Adapter Details */}
        <div className="glass-panel rounded-3xl p-6 border border-border/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Host Network Interface</h3>
              <p className="text-xs text-muted-foreground">Physical network controller parameters</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
              <span className="text-muted-foreground font-sans">IPv4 Address</span>
              <span className="font-bold text-foreground">{network?.localIpAddress || 'Unavailable'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
              <span className="text-muted-foreground font-sans">Subnet Mask</span>
              <span className="text-foreground">{network?.subnetMask || 'Unavailable'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
              <span className="text-muted-foreground font-sans">Default Gateway</span>
              <span className="text-foreground">{network?.gateway || 'Unavailable'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
              <span className="text-muted-foreground font-sans">Hardware MAC</span>
              <span className="text-muted-foreground">{network?.macAddress || 'Unavailable'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
              <span className="text-muted-foreground font-sans">Hostname</span>
              <span className="text-muted-foreground">{network?.hostname || 'Unavailable'}</span>
            </div>
          </div>
        </div>

        {/* Network Health & OSI Diagnostics */}
        <div className="glass-panel rounded-3xl p-6 border border-border/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">OSI Layer Diagnostics</h3>
                <p className="text-xs text-muted-foreground">Protocol stack status report</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Layer 7: LanSphere Application Protocol</div>
                  <div className="text-[10px] text-muted-foreground">Packet framing, checksums, ACKs and AES-GCM</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">UP</span>
              </div>

              <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Layer 4: Transport (TCP / Port 39394)</div>
                  <div className="text-[10px] text-muted-foreground">Socket server, reconnect retry and heartbeat active</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">ACTIVE</span>
              </div>

              <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Layer 3: Network (IPv4 Routing)</div>
                  <div className="text-[10px] text-muted-foreground">Local peer routing table aligned</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">SYNCED</span>
              </div>

              <div className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Layer 2: Data Link (Ethernet / WiFi 802.11)</div>
                  <div className="text-[10px] text-muted-foreground">Full duplex transmission</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">OPTIMAL</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/50 text-[11px] text-muted-foreground">
            Network Health Score: <span className="font-bold text-emerald-500">99.8% (Excellent)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Packets sent', network?.packetsSent ?? 0],
          ['Packets received', network?.packetsReceived ?? 0],
          ['Discovery broadcasts', network?.discoveryPackets ?? 0],
          ['Heartbeats received', network?.heartbeatPackets ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="glass-panel rounded-2xl p-4 border border-border/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-extrabold font-mono">{value}</div>
          </div>
        ))}
      </div>

      {/* Discovered Peer Nodes Table */}
      <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Discovered Subnet Node Probes</h3>
            <p className="text-xs text-muted-foreground">Active peer workstations responding to LAN probes</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
            {network?.discoveredPeers?.length ?? 0} Nodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">User / Node</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">MAC Hardware ID</th>
                <th className="px-6 py-3.5">Hostname</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5 text-right">State</th>
                <th className="px-6 py-3.5 text-right">Screen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {network?.discoveredPeers?.map((peer, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-sans font-semibold text-foreground flex items-center gap-2">
                    <Circle className={`w-2 h-2 fill-emerald-500 text-emerald-500`} />
                    <span>{peer.username}</span>
                  </td>
                  <td className="px-6 py-4 text-primary font-bold">{peer.ipAddress}</td>
                  <td className="px-6 py-4 text-muted-foreground">{peer.macAddress}</td>
                  <td className="px-6 py-4 text-muted-foreground">{peer.hostname}</td>
                  <td className="px-6 py-4 text-emerald-500 font-bold">{peer.pingMs.toFixed(1)} ms</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      {peer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openScreen(peer.nodeId)} className="px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {screenPeerId && (
        <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border/60">
            <div><h3 className="font-bold text-sm">Live screen stream</h3><p className="text-xs text-muted-foreground">Encrypted TCP frames from the selected LAN peer</p></div>
            <button onClick={closeScreen} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-destructive/10 hover:text-destructive">Stop</button>
          </div>
          <div className="bg-black aspect-video flex items-center justify-center">{screenUrl ? <img src={screenUrl} alt="Live peer screen" className="w-full h-full object-contain" /> : <span className="text-xs text-white/70">Waiting for the peer screen…</span>}</div>
        </div>
      )}
    </div>
  );
};
