import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UsersRound,
  Share2,
  Download,
  Activity,
  Bell,
  Settings,
  Info,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotificationStore } from '../../stores/useNotificationStore';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Groups', path: '/groups', icon: UsersRound },
    { name: 'File Sharing', path: '/files', icon: Share2 },
    { name: 'Downloads', path: '/downloads', icon: Download },
    { name: 'Network Monitor', path: '/network', icon: Activity },
    { name: 'Activity Logs', path: '/activities', icon: ShieldCheck },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <aside className="w-64 h-screen flex flex-col glass-panel border-r border-border/70 select-none transition-all duration-300">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-border/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Radio className="w-5 h-5 text-white animate-pulse-subtle" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            LanSphere
          </h1>
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            LAN Peer Engine
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white animate-bounce">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Network Node Info Card */}
      <div className="p-3 border-t border-border/60">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Node IP</span>
            <span className="font-mono text-foreground font-semibold">
              {user?.ipAddress || '192.168.1.105'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">MAC ID</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {user?.macAddress || 'A4:83:E7:2B:11:01'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              P2P Ready
            </span>
            <span className="text-[10px] text-muted-foreground">Port 8080</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
