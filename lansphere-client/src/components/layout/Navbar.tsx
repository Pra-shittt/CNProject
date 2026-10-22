import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Wifi,
  Sparkles,
  User as UserIcon,
  Circle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { userService } from '../../services/userService';
import { networkService } from '../../services/networkService';
import { UserStatus } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, setIsOpen, isOpen } = useNotificationStore();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [latency, setLatency] = useState<number>(1.4);

  // Poll latency gently
  useEffect(() => {
    const fetchLatency = async () => {
      try {
        const net = await networkService.getNetworkStatus();
        setLatency(net.latencyMs);
      } catch (e) {}
    };
    fetchLatency();
    const interval = setInterval(fetchLatency, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (status: UserStatus) => {
    try {
      const updated = await userService.updateProfile({ status });
      setUser(updated);
      setProfileDropdownOpen(false);
    } catch (e) {}
  };

  const getStatusColor = (status?: UserStatus) => {
    switch (status) {
      case 'ONLINE': return 'text-emerald-500 fill-emerald-500';
      case 'AWAY': return 'text-amber-500 fill-amber-500';
      case 'BUSY': return 'text-rose-500 fill-rose-500';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

  return (
    <header className="h-16 px-6 glass-panel border-b border-border/70 flex items-center justify-between z-20">
      {/* Left: Network Telemetry Pill */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-xs">
          <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">LAN Optimal</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-emerald-500 font-medium">{latency} ms ping</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local Area Network Discovery active</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted/70 border border-transparent hover:border-border/50 transition-all"
          >
            <div className="relative">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'user'}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full bg-indigo-500/10 object-cover ring-2 ring-primary/20"
              />
              <Circle className={`w-2.5 h-2.5 absolute bottom-0 right-0 ${getStatusColor(user?.status)}`} />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight">{user?.displayName || user?.username}</div>
              <div className="text-[10px] text-muted-foreground lowercase">{user?.status || 'offline'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-border/50">
                <p className="text-xs font-semibold">{user?.displayName || user?.username}</p>
                <p className="text-[11px] font-mono text-muted-foreground">{user?.ipAddress || '127.0.0.1'}</p>
              </div>

              {/* Status Selector */}
              <div className="py-2 border-b border-border/50">
                <p className="px-3 text-[10px] uppercase font-bold text-muted-foreground mb-1">Set Presence</p>
                {(['ONLINE', 'AWAY', 'BUSY', 'OFFLINE'] as UserStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-muted text-left capitalize"
                  >
                    <Circle className={`w-2 h-2 ${getStatusColor(st)}`} />
                    <span>{st.toLowerCase()}</span>
                  </button>
                ))}
              </div>

              {/* Logout Option */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 mt-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of LanSphere</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
