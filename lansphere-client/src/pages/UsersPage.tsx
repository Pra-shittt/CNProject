import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  MessageSquare,
  Circle,
  Network,
  Cpu,
  Clock,
  Sparkles,
  Wifi,
  X,
  ShieldCheck,
  Server,
  Radio,
} from 'lucide-react';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { User, UserStatus } from '../types';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStartChat = async (targetUserId: number) => {
    try {
      const conv = await chatService.startDirectChat(targetUserId);
      navigate(`/chat?conversationId=${conv.id}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ONLINE': return 'text-emerald-500 fill-emerald-500';
      case 'AWAY': return 'text-amber-500 fill-amber-500';
      case 'BUSY': return 'text-rose-500 fill-rose-500';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.ipAddress || '').includes(searchQuery);

    if (filterTab === 'ONLINE') return matchesSearch && u.status !== 'OFFLINE';
    if (filterTab === 'OFFLINE') return matchesSearch && u.status === 'OFFLINE';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN Peer Network Roster</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time discovered nodes, hostnames, and IP/MAC hardware identifiers on your local subnet.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-semibold">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>Subnet ARP / Heartbeat Sync Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? 'All Peers' : tab.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, or IP..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          // Skeleton loaders
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-3xl p-6 border border-border/60 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-muted rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-28 h-4 bg-muted rounded" />
                  <div className="w-20 h-3 bg-muted rounded" />
                </div>
              </div>
              <div className="h-16 bg-muted/40 rounded-2xl" />
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-foreground text-sm">No peers found</p>
            <p className="text-xs mt-1">Try refining your search terms or verify your subnet connection.</p>
          </div>
        ) : (
          filteredUsers.map((peer) => (
            <div
              key={peer.id}
              className="glass-panel rounded-3xl p-6 border border-border/70 flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm group"
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative cursor-pointer" onClick={() => setSelectedUser(peer)}>
                    <img
                      src={peer.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${peer.username}`}
                      alt={peer.username}
                      className="w-14 h-14 rounded-2xl bg-muted object-cover ring-2 ring-border/50 group-hover:ring-primary/40 transition-all"
                    />
                    <Circle
                      className={`w-3.5 h-3.5 absolute -bottom-1 -right-1 ring-2 ring-card rounded-full ${getStatusColor(
                        peer.status
                      )}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() => setSelectedUser(peer)}
                      className="font-bold text-base leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {peer.displayName || peer.username}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">@{peer.username}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                      {peer.status}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {peer.bio || 'Computer network collaborator.'}
                </p>

                {/* Telemetry Details */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 text-[11px] space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-sans">IP Address:</span>
                    <span className="text-foreground font-semibold">{peer.ipAddress || '192.168.1.100'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-sans">MAC Address:</span>
                    <span className="text-muted-foreground">{peer.macAddress || 'A4:83:E7:2B:11:00'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-sans">Host Device:</span>
                    <span className="text-muted-foreground truncate max-w-[130px]">{peer.hostname || 'lan-node'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-5 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {peer.lastSeen
                    ? `Seen ${new Date(peer.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Recent'}
                </span>

                <button
                  onClick={() => handleStartChat(peer.id)}
                  className="py-1.5 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Chat</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Peer Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border/80">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span>Peer Node Telemetry</span>
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.username}`}
                alt={selectedUser.username}
                className="w-16 h-16 rounded-2xl bg-muted object-cover ring-2 ring-primary/30"
              />
              <div>
                <h4 className="font-bold text-lg">{selectedUser.displayName || selectedUser.username}</h4>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <Circle className={`w-2 h-2 ${getStatusColor(selectedUser.status)}`} />
                  <span className="font-semibold capitalize">{selectedUser.status.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4 bg-muted/30 p-3 rounded-xl border border-border/40">
              {selectedUser.bio || 'Computer network peer node.'}
            </p>

            <div className="space-y-2 font-mono text-xs mb-5">
              <div className="p-2.5 rounded-xl bg-card border border-border/40 flex justify-between">
                <span className="text-muted-foreground font-sans">Node IP:</span>
                <span className="font-bold text-primary">{selectedUser.ipAddress || '192.168.1.100'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/40 flex justify-between">
                <span className="text-muted-foreground font-sans">MAC ID:</span>
                <span className="text-foreground">{selectedUser.macAddress || '00:1A:2B:3C:4D:5E'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/40 flex justify-between">
                <span className="text-muted-foreground font-sans">Hostname:</span>
                <span className="text-foreground">{selectedUser.hostname || 'lan-node'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/40 flex justify-between">
                <span className="text-muted-foreground font-sans">Peer Member Since:</span>
                <span className="text-muted-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const id = selectedUser.id;
                setSelectedUser(null);
                handleStartChat(id);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start Direct Conversation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
