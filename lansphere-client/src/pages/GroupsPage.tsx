import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersRound,
  Plus,
  Search,
  MessageSquare,
  DoorOpen,
  UserCheck,
  Shield,
  Circle,
  X,
  Users,
  AlertTriangle,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { groupService } from '../services/groupService';
import { userService } from '../services/userService';
import { Group, User } from '../types';
import { useAuthStore } from '../stores/useAuthStore';

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'MY' | 'PUBLIC'>('MY');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Group Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  // Group Details / Members Modal
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);

  // Leave Confirm Dialog
  const [leaveGroupId, setLeaveGroupId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mine, pubs, users] = await Promise.all([
        groupService.getMyGroups(),
        groupService.getPublicGroups(),
        userService.getAllUsers(),
      ]);
      setMyGroups(mine);
      setPublicGroups(pubs);
      setAllUsers(users.filter((u) => u.id !== user?.id));
    } catch (e) {
      console.error('Failed to load groups', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || creating) return;

    try {
      setCreating(true);
      await groupService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        isPublic: true,
        maxMembers: 50,
        memberIds: selectedMemberIds,
      });

      setIsModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedMemberIds([]);
      setToastMessage('Group channel created successfully!');
      setTimeout(() => setToastMessage(null), 3000);
      loadData();
    } catch (e) {
      console.error('Failed to create group', e);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (groupId: number) => {
    try {
      await groupService.joinGroup(groupId);
      setToastMessage('Joined group channel!');
      setTimeout(() => setToastMessage(null), 3000);
      loadData();
    } catch (e) {
      console.error('Failed to join group', e);
    }
  };

  const handleLeaveConfirm = async () => {
    if (!leaveGroupId) return;
    try {
      await groupService.leaveGroup(leaveGroupId);
      setToastMessage('Left group channel.');
      setTimeout(() => setToastMessage(null), 3000);
      setLeaveGroupId(null);
      loadData();
    } catch (e) {
      console.error('Failed to leave group', e);
    }
  };

  const toggleMemberSelection = (id: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const currentList = tab === 'MY' ? myGroups : publicGroups;
  const filteredList = currentList.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl glass-panel border border-primary/40 text-primary text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN Groups & Channels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create topic-focused multicast collaboration spaces with your local network peers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('MY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'MY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setTab('PUBLIC')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'PUBLIC'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Public Groups ({publicGroups.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          // Skeleton loaders
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-3xl p-6 border border-border/60 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-muted rounded" />
                  <div className="w-20 h-3 bg-muted rounded" />
                </div>
              </div>
              <div className="h-10 bg-muted/40 rounded-xl" />
            </div>
          ))
        ) : filteredList.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <UsersRound className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-foreground text-sm">No group channels found</p>
            <p className="text-xs mt-1">Create a group above to start broadcasting to your subnet peers.</p>
          </div>
        ) : (
          filteredList.map((group) => {
            const isOwner = group.ownerId === user?.id;
            const isMember = group.members?.some((m) => m.userId === user?.id);

            return (
              <div
                key={group.id}
                className="glass-panel rounded-3xl p-6 border border-border/70 flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={group.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                        alt={group.name}
                        className="w-12 h-12 rounded-2xl bg-muted object-cover ring-2 ring-border/50"
                      />
                      <div>
                        <h3 className="font-bold text-base leading-tight">{group.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Owner: {group.ownerName}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedGroupForMembers(group)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground border border-border/50 transition-colors"
                      title="View Members"
                    >
                      {group.memberCount} members
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {group.description || 'No description provided for this group channel.'}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 mt-6 border-t border-border/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/chat?conversationId=${group.conversationId}`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>

                  {!isOwner && isMember && (
                    <button
                      onClick={() => setLeaveGroupId(group.id)}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Leave Group"
                    >
                      <DoorOpen className="w-4 h-4" />
                    </button>
                  )}

                  {!isMember && (
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="py-2 px-3 rounded-xl bg-card border border-border/80 hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Join</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Members Modal */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border/80">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>{selectedGroupForMembers.name} — Members</span>
              </h3>
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {selectedGroupForMembers.members?.map((m) => (
                <div key={m.id} className="p-2.5 rounded-xl bg-card border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`}
                      alt={m.username}
                      className="w-8 h-8 rounded-lg bg-muted object-cover"
                    />
                    <div>
                      <div className="font-semibold text-xs text-foreground">{m.displayName || m.username}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{m.status.toLowerCase()}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.role === 'OWNER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedGroupForMembers(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Dialog */}
      {leaveGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border/80">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Leave Channel?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Are you sure you want to leave this group channel? You will no longer receive broadcast announcements from this group.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setLeaveGroupId(null)}
                className="px-4 py-2 rounded-xl hover:bg-muted text-xs font-bold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-primary" />
                <span>Create Group Channel</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Systems & Socket Engineers"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Describe the purpose of this LAN channel..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Invite Initial Peers
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border/50 p-2 bg-muted/20">
                  {allUsers.map((u) => {
                    const isSelected = selectedMemberIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMemberSelection(u.id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted'
                        }`}
                      >
                        <span>{u.displayName || u.username}</span>
                        <span className="font-mono text-[10px] opacity-75">{u.ipAddress || '192.168.1.x'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-muted text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all"
                >
                  {creating ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
