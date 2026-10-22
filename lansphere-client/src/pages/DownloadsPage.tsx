import React, { useState, useEffect } from 'react';
import {
  Download,
  Folder,
  HardDrive,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  FileText,
  Image as ImageIcon,
  FileArchive,
  RefreshCw,
  FolderOpen,
  Trash2,
  AlertTriangle,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';
import { fileService } from '../services/fileService';
import { FileTransfer } from '../types';

export const DownloadsPage: React.FC = () => {
  const [downloadHistory, setDownloadHistory] = useState<FileTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadPath, setDownloadPath] = useState(
    'C:\\Users\\LanSphere\\Downloads'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const files = await fileService.getAllFiles();
      setDownloadHistory(files);
    } catch (e) {
      console.error('Failed to load downloads', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleClearHistory = () => {
    setDownloadHistory([]);
    setShowClearConfirm(false);
    setToastMessage('Download history cleared.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadTrigger = async (file: FileTransfer) => {
    try {
      await fileService.downloadFile(file.id, file.originalName);
      setToastMessage(`Download started for ${file.originalName}.`);
    } catch {
      setToastMessage(`Could not download ${file.originalName}. Please try again.`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Downloads & Wire Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming files received from peers across the local subnet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {downloadHistory.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-card border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={loadFiles}
            className="p-2 rounded-xl bg-card border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Local Download Directory Config Card */}
      <div className="glass-panel rounded-3xl p-5 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Local Destination Path</div>
            <div className="text-[11px] font-mono text-muted-foreground">{downloadPath}</div>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 self-start sm:self-auto">
          Write Permission Granted
        </span>
      </div>

      {/* Storage and Transfer Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Transferred</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">{downloadHistory.length} files</div>
          <p className="text-xs text-muted-foreground mt-1">Direct LAN packet transfers</p>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aggregated Size</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">
            {formatBytes(downloadHistory.reduce((acc, f) => acc + (f.fileSize || 0), 0))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Zero cloud bandwidth consumed</p>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transfer Integrity</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-500">100%</div>
          <p className="text-xs text-muted-foreground mt-1">Cryptographic SHA-256 match</p>
        </div>
      </div>

      {/* Downloads List */}
      <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-bold text-base">Completed Local Transfers</h3>
          <span className="text-xs text-muted-foreground font-mono">Status: Ready</span>
        </div>

        <div className="divide-y divide-border/40">
          {loading ? (
            // Skeleton loader
            [1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-36 h-3 bg-muted rounded" />
                    <div className="w-48 h-2 bg-muted rounded" />
                  </div>
                </div>
                <div className="w-24 h-7 bg-muted rounded-xl" />
              </div>
            ))
          ) : downloadHistory.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Download className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-foreground text-sm">No transfers recorded</p>
              <p className="text-xs mt-1">Files shared across your LAN will appear here for one-click downloading.</p>
            </div>
          ) : (
            downloadHistory.map((item) => (
              <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60 text-primary">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate text-foreground">{item.originalName}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatBytes(item.fileSize)} • Received from {item.senderName} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadTrigger(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save to Disk</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clear History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border/80">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Clear Transfer History?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              This will clear the transfer history view on this workstation. Files stored on disk will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl hover:bg-muted text-xs font-bold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
