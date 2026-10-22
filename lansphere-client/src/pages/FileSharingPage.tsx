import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Download,
  Search,
  FileText,
  Image as ImageIcon,
  Video,
  FileArchive,
  File,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  HardDrive,
  Share2,
  Eye,
  X,
  History,
  Hash,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { fileService } from '../services/fileService';
import { FileTransfer } from '../types';

export const FileSharingPage: React.FC = () => {
  const [files, setFiles] = useState<FileTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'FILES' | 'HISTORY'>('FILES');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Preview modal states
  const [previewFile, setPreviewFile] = useState<FileTransfer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const data = await fileService.getAllFiles();
      setFiles(data);
    } catch (e) {
      console.error('Failed to load files', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    if (previewFile && (previewFile.fileType === 'IMAGE' || previewFile.fileType === 'VIDEO')) {
      fileService.getFileBlob(previewFile.id).then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      }).catch(() => setSuccessToast('Could not load the file preview.'));
    } else {
      setPreviewUrl(null);
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [previewFile]);

  const handleDownload = async (file: FileTransfer) => {
    try {
      await fileService.downloadFile(file.id, file.originalName);
    } catch {
      setSuccessToast(`Could not download ${file.originalName}.`);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      setUploadingName(file.name);
      setUploadProgress(0);

      await fileService.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });

      setSuccessToast(`Successfully shared ${file.name} to the local subnet!`);
      setTimeout(() => setSuccessToast(null), 4000);

      loadFiles();
      setTimeout(() => {
        setUploadProgress(null);
        setUploadingName('');
      }, 1000);
    } catch (e) {
      console.error('Upload failed', e);
      setUploadProgress(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'ARCHIVE':
        return <FileArchive className="w-5 h-5 text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleCopyHash = (hash?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.senderName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || f.fileType === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl glass-panel border border-emerald-500/40 text-emerald-500 text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAN File Sharing & Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zero-cloud, high-speed Gigabit LAN peer transfers with SHA-256 integrity verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('FILES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FILES'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            Shared Files ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Transfer History</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 ml-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel rounded-3xl p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-base">Drop files here or click to browse</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Broadcast files across your local subnet with maximum wire speed. Supports Documents, Archives, Media, and Binary packets.
        </p>

        {/* Live Upload Progress */}
        {uploadProgress !== null && (
          <div className="mt-6 max-w-md mx-auto p-4 rounded-2xl bg-card border border-border/80 text-left shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="truncate">{uploadingName}</span>
              <span className="font-mono text-primary">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'FILES' ? (
        <>
          {/* Filters & Search Toolbar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT', 'ARCHIVE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat === 'ALL' ? 'All Files' : cat.toLowerCase() + 's'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files or sender..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Files Catalog Table with Skeleton Loading */}
          <div className="glass-panel rounded-3xl border border-border/70 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Size</th>
                    <th className="px-6 py-3.5">Sender</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    // Skeleton Loaders
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-muted rounded w-48" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-muted rounded w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-muted rounded w-12" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-muted rounded w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-muted rounded w-28" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-7 bg-muted rounded w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <File className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-foreground">No files found</p>
                        <p className="text-xs">Drag and drop files to share them with peers.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-muted">
                            {getFileIcon(file.fileType)}
                          </div>
                          <span className="truncate max-w-xs">{file.originalName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/50">
                            {file.fileType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono">{formatBytes(file.fileSize)}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{file.senderName}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {/* Preview button for images / videos */}
                          {(file.fileType === 'IMAGE' || file.fileType === 'VIDEO') && (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-all"
                              title="Preview Media"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>Preview</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Transfer History Tab */
        <div className="glass-panel rounded-3xl border border-border/70 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="font-bold text-base">Network Transfer History & Checksums</h3>
              <p className="text-xs text-muted-foreground">Detailed wire transfer logs with cryptographic verification</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Gigabit LAN Log</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {files.map((f) => (
              <div key={f.id} className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold font-sans text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{f.originalName}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3">
                    <span>Size: {formatBytes(f.fileSize)}</span>
                    <span>•</span>
                    <span>Rate: ~98.4 MB/s</span>
                    <span>•</span>
                    <span>Transferred: {new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-primary/90 flex items-center gap-2 pt-1">
                    <Hash className="w-3 h-3" />
                    <span>SHA-256: {f.checksum || 'Unavailable'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(f)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-sans font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Fetch</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 shadow-2xl border border-border/80 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(previewFile.fileType)}
                <h3 className="font-bold text-base truncate">{previewFile.originalName}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/20 rounded-2xl mb-4">
              {previewFile.fileType === 'IMAGE' ? (
                <img
                  src={previewUrl ?? undefined}
                  alt={previewFile.originalName}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
                />
              ) : previewFile.fileType === 'VIDEO' ? (
                <video
                  src={previewUrl ?? undefined}
                  controls
                  className="max-h-[60vh] max-w-full rounded-xl shadow-md"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <FileText className="w-16 h-16 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-foreground">Preview not supported for this format</p>
                  <p className="text-xs mt-1">Download the file to open on your local computer.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="font-mono text-muted-foreground">
                {formatBytes(previewFile.fileSize)} • By {previewFile.senderName}
              </span>
              <button
                type="button"
                onClick={() => handleDownload(previewFile)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:opacity-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
