import React, { useState } from 'react';
import {
  User,
  Palette,
  Folder,
  Bell,
  Network,
  Shield,
  Save,
  CheckCircle2,
  HardDrive,
  Moon,
  Sun,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { userService } from '../services/userService';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [downloadFolder, setDownloadFolder] = useState('C:\\Users\\LanSphere\\Downloads');
  const [autoDiscover, setAutoDiscover] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        displayName,
        email,
        bio,
        avatarUrl,
      });
      setUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Node & Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your local collaborator identity, storage directory, and peer discovery parameters.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Profile Settings Section */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Peer Identity</h3>
            <p className="text-xs text-muted-foreground">Information visible to other computers on your LAN</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Local Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Bio / Role Description
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Avatar URL & Preview
            </label>
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'user'}`}
                alt="Avatar Preview"
                className="w-12 h-12 rounded-2xl bg-muted object-cover ring-2 ring-primary/30 flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Quick Styles:</span>
                  {['bottts', 'identicon', 'fun-emoji', 'thumbs'].map((style) => (
                    <button
                      type="button"
                      key={style}
                      onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/${style}/svg?seed=${user?.username || 'peer'}`)}
                      className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Update Identity'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Network & Storage Preferences */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Network & Storage Parameters</h3>
            <p className="text-xs text-muted-foreground">LAN sockets and download destination path</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Downloads Folder
            </label>
            <input
              type="text"
              value={downloadFolder}
              onChange={(e) => setDownloadFolder(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/50">
            <div>
              <div className="text-xs font-bold">Auto Subnet Discovery</div>
              <div className="text-[11px] text-muted-foreground">Broadcast presence beacons to LAN subnet</div>
            </div>
            <input
              type="checkbox"
              checked={autoDiscover}
              onChange={(e) => setAutoDiscover(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/50">
            <div>
              <div className="text-xs font-bold">Desktop Sound & Toast Alerts</div>
              <div className="text-[11px] text-muted-foreground">Trigger desktop notifications when peers send files</div>
            </div>
            <input
              type="checkbox"
              checked={desktopAlerts}
              onChange={(e) => setDesktopAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Theme & Appearance */}
      <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Appearance & Interface Theme</h3>
            <p className="text-xs text-muted-foreground">Select dark or light color scheme</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Active Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
