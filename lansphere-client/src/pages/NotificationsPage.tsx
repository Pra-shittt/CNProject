import React, { useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Share2,
  Users,
  AlertCircle,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useNotificationStore } from '../stores/useNotificationStore';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'FILE_TRANSFER': return <Share2 className="w-5 h-5 text-emerald-400" />;
      case 'GROUP_INVITE':
      case 'GROUP_JOIN': return <Users className="w-5 h-5 text-cyan-400" />;
      default: return <Radio className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN Notification Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time peer announcements, file transfer alerts, and system telemetry events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl bg-card border border-border/70 hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-primary" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List Card */}
      <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden shadow-sm">
        <div className="p-4 px-6 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inbox</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{notifications.length} total notifications</span>
        </div>

        <div className="divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 stroke-[1] mb-2 mx-auto opacity-30" />
              <p className="font-semibold text-sm text-foreground">You're all caught up!</p>
              <p className="text-xs mt-1">No pending notifications on your local node.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`p-5 transition-all cursor-pointer flex items-start gap-4 ${
                  notif.isRead ? 'hover:bg-muted/30 opacity-75' : 'bg-primary/5 hover:bg-primary/10 font-semibold'
                }`}
              >
                <div className="p-2.5 rounded-2xl bg-card border border-border/60">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-foreground truncate">{notif.title}</h3>
                    <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.content}</p>

                  {notif.senderName && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>From: {notif.senderName}</span>
                    </div>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
