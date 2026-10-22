import React, { useEffect } from 'react';
import { X, CheckCheck, Bell, MessageSquare, Share2, Users, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../stores/useNotificationStore';

export const NotificationDrawer: React.FC = () => {
  const { notifications, unreadCount, isOpen, setIsOpen, fetchNotifications, markAsRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'FILE_TRANSFER':
        return <Share2 className="w-4 h-4 text-emerald-400" />;
      case 'GROUP_INVITE':
      case 'GROUP_JOIN':
        return <Users className="w-4 h-4 text-cyan-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-border/80 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base">Notifications Center</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Bell className="w-10 h-10 stroke-[1.2] mb-2 opacity-50" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs">LAN alerts and messages will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-muted/20 border-border/40 text-muted-foreground'
                      : 'bg-primary/5 border-primary/30 text-foreground shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-card border border-border/50">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.content}
                      </p>
                      {notif.senderName && (
                        <p className="text-[10px] text-primary font-medium mt-1">
                          From: {notif.senderName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
