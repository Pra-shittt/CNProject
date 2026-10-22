import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Share2,
  HardDrive,
  Activity,
  ArrowUpRight,
  Plus,
  Send,
  Download,
  Wifi,
  Shield,
  Clock,
  Circle,
  FileText,
  FileArchive,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { fileService } from '../services/fileService';
import { networkService } from '../services/networkService';
import { chatService } from '../services/chatService';
import { DashboardData, NetworkStatus } from '../types';
import { useAuthStore } from '../stores/useAuthStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dash, net] = await Promise.all([
        dashboardService.getDashboardData(),
        networkService.getNetworkStatus(),
      ]);
      setData(dash);
      setNetwork(net);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStartChat = async (targetUserId: number) => {
    try {
      const conv = await chatService.startDirectChat(targetUserId);
      navigate(`/chat?conversationId=${conv.id}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'ARCHIVE': return <FileArchive className="w-4 h-4 text-amber-400" />;
      default: return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-xl w-64" />
            <div className="h-4 bg-muted rounded-xl w-48" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-muted rounded-xl w-28" />
            <div className="h-9 bg-muted rounded-xl w-28" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-3xl p-6 h-28 bg-muted/40" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 h-64 bg-muted/40" />
          <div className="glass-panel rounded-3xl p-6 h-64 bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.displayName || user?.username} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connected to LAN Subnet • Node IP <span className="font-mono text-foreground font-semibold">{user?.ipAddress || '192.168.1.105'}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </button>
          <button
            onClick={() => navigate('/files')}
            className="px-4 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Share File</span>
          </button>
          <button
            onClick={() => navigate('/groups')}
            className="px-4 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Online Users */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Peers</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{data?.onlineUsers ?? 0}</span>
            <span className="text-xs text-muted-foreground">/ {data?.totalUsers ?? 0} total</span>
          </div>
          <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1 font-medium">
            <Circle className="w-2 h-2 fill-emerald-500" />
            <span>Subnet live discovery</span>
          </div>
        </div>

        {/* Metric 2: Messages Exchanged */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Messages</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{data?.totalMessages ?? 0}</span>
            <span className="text-xs text-muted-foreground">dispatched</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <span>Across direct & group channels</span>
          </div>
        </div>

        {/* Metric 3: Shared Files */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shared Files</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{data?.totalFiles ?? 0}</span>
            <span className="text-xs text-muted-foreground">transfers</span>
          </div>
          <div className="mt-2 text-xs text-cyan-400 flex items-center gap-1 font-medium">
            <span>Gigabit LAN zero-cloud</span>
          </div>
        </div>

        {/* Metric 4: Storage Vol */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume Stored</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{formatBytes(data?.totalStorageBytes || 0)}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <span>SHA-256 verified integrity</span>
          </div>
        </div>
      </div>

      {/* Network Health & Telemetry Strip */}
      <div className="glass-panel rounded-3xl p-6 border border-border/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Wifi className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Local Area Network Status: {network?.status || 'OFFLINE'}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  Gigabit Backbone
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subnet: {network?.subnetMask || 'Unavailable'} • Gateway: {network?.gateway || 'Unavailable'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                LSAP: {network?.packetsSent ?? 0} sent / {network?.packetsReceived ?? 0} received · {network?.discoveryPackets ?? 0} discovery packets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/60">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">LAN Latency</div>
              <div className="text-xl font-extrabold font-mono text-emerald-500">{network?.latencyMs ?? 0} ms</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Packet Loss</div>
              <div className="text-xl font-extrabold font-mono text-foreground">{network?.packetLossPercent ?? 0.0}%</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Bandwidth</div>
              <div className="text-xl font-extrabold font-mono text-indigo-400">{network?.bandwidthUsageMbps ?? 0} Mbps</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Transfer Rate</div>
              <div className="text-xl font-extrabold font-mono text-cyan-400">{network?.transferSpeedMbps ?? 0} MB/s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Online Peers & Recent Chats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Online Peers Carousel/List */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Discovered Peers Online</h3>
                <p className="text-xs text-muted-foreground">Computers currently responsive on your local subnet</p>
              </div>
              <button
                onClick={() => navigate('/users')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data?.recentOnlineUsers?.map((peer) => (
                <div
                  key={peer.id}
                  onClick={() => handleStartChat(peer.id)}
                  className="p-3.5 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all cursor-pointer group flex items-center gap-3 shadow-sm hover:shadow-md"
                >
                  <div className="relative">
                    <img
                      src={peer.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${peer.username}`}
                      alt={peer.username}
                      className="w-10 h-10 rounded-xl bg-muted object-cover ring-2 ring-border/40 group-hover:ring-primary/40 transition-all"
                    />
                    <Circle className="w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-emerald-500 ring-2 ring-card rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                      {peer.displayName || peer.username}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">
                      {peer.ipAddress || '192.168.1.100'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Recent Conversations</h3>
                <p className="text-xs text-muted-foreground">Latest peer messages and group channels</p>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Open Chat</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {data?.recentChats && data.recentChats.length > 0 ? (
                data.recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat?conversationId=${chat.id}`)}
                    className="p-3.5 rounded-2xl bg-card border border-border/50 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={chat.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`}
                        alt={chat.name || 'Chat'}
                        className="w-9 h-9 rounded-xl bg-muted object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{chat.name || 'Conversation'}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {chat.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-muted-foreground">
                        {chat.lastMessageAt
                          ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No active chats yet. Start a direct conversation above!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Files & Activity Stream */}
        <div className="space-y-6">
          {/* Recent Files */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Recent Shared Files</h3>
              <button
                onClick={() => navigate('/files')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>All Files</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {data?.recentFiles && data.recentFiles.length > 0 ? (
                data.recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-2xl bg-card border border-border/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-muted">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">{file.originalName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatBytes(file.fileSize)} • By {file.senderName}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileService.downloadFile(file.id, file.originalName)}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No files transferred yet.
                </div>
              )}
            </div>
          </div>

          {/* Activity Stream */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Node Audit Stream</h3>
              <button
                onClick={() => navigate('/activities')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Logs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {data?.recentActivity?.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{act.description || act.action}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span>{act.username || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
