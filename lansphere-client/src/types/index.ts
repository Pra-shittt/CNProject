export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY' | 'DO_NOT_DISTURB';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'AUDIO' | 'VIDEO';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type FileTransferStatus = 'PENDING' | 'UPLOADING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PAUSED';

export interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  status: UserStatus;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  lastSeen?: string;
  createdAt: string;
}

export interface FileTransfer {
  id: number;
  fileName: string;
  originalName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER';
  fileSize: number;
  mimeType: string;
  senderId: number;
  senderName: string;
  receiverId?: number;
  receiverName?: string;
  conversationId?: number;
  status: FileTransferStatus;
  progress: number;
  downloadUrl: string;
  checksum?: string;
  transferSpeed?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Message {
  id: number;
  content: string;
  type: MessageType;
  status: MessageStatus;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  conversationId: number;
  replyToId?: number;
  isEdited?: boolean;
  fileTransfer?: FileTransfer;
  createdAt: string;
  editedAt?: string;
}

export interface Conversation {
  id: number;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: User[];
  createdAt: string;
}

export interface GroupMember {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  ownerId: number;
  ownerName: string;
  conversationId: number;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  members: GroupMember[];
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'MESSAGE' | 'FILE_TRANSFER' | 'GROUP_INVITE' | 'GROUP_JOIN' | 'GROUP_LEAVE' | 'USER_ONLINE' | 'USER_OFFLINE' | 'SYSTEM';
  title: string;
  content?: string;
  isRead: boolean;
  referenceId?: number;
  referenceType?: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId?: number;
  username?: string;
  userAvatar?: string;
  action: string;
  description?: string;
  ipAddress?: string;
  targetType?: string;
  targetId?: number;
  createdAt: string;
}

export interface NetworkPeerInfo {
  nodeId: string;
  username: string;
  ipAddress: string;
  macAddress: string;
  hostname: string;
  pingMs: number;
  status: string;
}

export interface NetworkStatus {
  status: 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  packetLossPercent: number;
  bandwidthUsageMbps: number;
  maxBandwidthMbps: number;
  transferSpeedMbps: number;
  localIpAddress: string;
  subnetMask: string;
  gateway: string;
  macAddress: string;
  hostname: string;
  activePeersCount: number;
  totalTransfersToday: number;
  discoveredPeers: NetworkPeerInfo[];
  packetsSent: number;
  packetsReceived: number;
  discoveryPackets: number;
  heartbeatPackets: number;
  connectionUptimeSeconds: number;
}

export interface DashboardData {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalFiles: number;
  totalGroups: number;
  activeTransfers: number;
  totalStorageBytes: number;
  recentOnlineUsers: User[];
  recentChats: Conversation[];
  recentFiles: FileTransfer[];
  recentActivity: ActivityLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}
