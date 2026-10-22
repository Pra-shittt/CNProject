import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  User,
} from 'lucide-react';
import { activityService } from '../services/activityService';
import { ActivityLog } from '../types';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await activityService.getRecentActivities(50);
        setLogs(data);
      } catch (e) {
        console.error('Failed to load logs', e);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ipAddress || '').includes(searchQuery) ||
      (log.username || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN Node Security & Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable system and packet dispatch audit trails recorded on this local node.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Audit Daemon: ACTIVE</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'USER_LOGIN', 'FILE_UPLOADED', 'GROUP_CREATED', 'NODE_ONLINE'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                actionFilter === filter
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, IP, or user..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px] font-sans">
              <tr>
                <th className="px-6 py-3.5">Action Code</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Source IP</th>
                <th className="px-6 py-3.5">Event Description</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground font-sans">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans font-semibold text-foreground">
                      {log.username || 'System'}
                    </td>
                    <td className="px-6 py-4 text-emerald-500 font-semibold">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="px-6 py-4 font-sans text-muted-foreground max-w-sm truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
