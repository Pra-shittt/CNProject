import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ShieldCheck, ArrowRight, UserPlus, LogIn, Sparkles, Network } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!username.trim() || !password) {
      setFormError('Please enter both username and password.');
      return;
    }

    try {
      if (isLoginTab) {
        await login(username.trim().toLowerCase(), password);
      } else {
        await register(username.trim().toLowerCase(), password, displayName, email);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

  const handleQuickDemoLogin = async (demoUser: string) => {
    try {
      await login(demoUser, 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-2xl shadow-indigo-500/30 mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">LanSphere</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Redefining Local Network Collaboration
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-xs text-muted-foreground">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Cloud • LAN Peer Architecture</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-muted/60 p-1 mb-6 border border-border/40">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setFormError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isLoginTab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setFormError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isLoginTab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Peer
            </button>
          </div>

          {(formError || error) && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alice"
                className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            {!isLoginTab && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alice Johnson"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                    placeholder="e.g. alice@lansphere.local"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Connecting to local node...</span>
              ) : (
                <>
                  <span>{isLoginTab ? 'Connect to LAN' : 'Join Peer Network'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Peer Selector */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Test Peers (Pre-seeded):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alice')}
                className="px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/40 text-xs font-medium text-left flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                  A
                </div>
                <div>
                  <div className="font-semibold text-foreground">Alice</div>
                  <div className="text-[10px] text-muted-foreground">Lead Eng</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bob')}
                className="px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/40 text-xs font-medium text-left flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                  B
                </div>
                <div>
                  <div className="font-semibold text-foreground">Bob</div>
                  <div className="text-[10px] text-muted-foreground">Security</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local subnet traffic never leaves your local physical network.</span>
        </p>
      </div>
    </div>
  );
};
