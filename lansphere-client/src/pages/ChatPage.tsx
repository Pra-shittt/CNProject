import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Circle,
  FileText,
  Image as ImageIcon,
  Download,
  Check,
  CheckCheck,
  UsersRound,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  X,
  Copy,
  Info,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { fileService } from '../services/fileService';
import { Conversation, Message } from '../types';
import { useAuthStore } from '../stores/useAuthStore';

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvIdFromQuery = searchParams.get('conversationId');

  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);

      if (data.length > 0) {
        if (activeConvIdFromQuery) {
          const match = data.find((c) => c.id === Number(activeConvIdFromQuery));
          if (match) {
            setActiveConversation(match);
            setShowMobileList(false);
          } else {
            setActiveConversation(data[0]);
          }
        } else if (!activeConversation) {
          setActiveConversation(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // When active conversation changes, load its messages and mark as read
  useEffect(() => {
    if (!activeConversation) return;

    setSearchParams({ conversationId: activeConversation.id.toString() });

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(activeConversation.id);
        setMessages(msgs);
        chatService.markAsRead(activeConversation.id);
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    };

    loadMessages();

    // Poll messages gently for local updates
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [activeConversation?.id]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingSimulated]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await chatService.sendMessage({
        conversationId: activeConversation.id,
        content: text,
        type: 'TEXT',
      });
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation list lastMessage
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : c
        )
      );

      // Simulate peer typing response after a short delay for demonstration
      if (activeConversation.type === 'DIRECT') {
        setTimeout(() => setIsTypingSimulated(true), 1200);
        setTimeout(() => setIsTypingSimulated(false), 3800);
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    try {
      setSending(true);
      const uploadedFile = await fileService.uploadFile(file, undefined, undefined, activeConversation.id);

      const newMsg = await chatService.sendMessage({
        conversationId: activeConversation.id,
        content: `Sent attachment: ${file.name}`,
        type: uploadedFile.fileType === 'IMAGE' ? 'IMAGE' : 'FILE',
        fileTransferId: uploadedFile.id,
      });

      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to upload file attachment', err);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedMessages = messages.filter((m) =>
    !inChatSearch.trim() || m.content.toLowerCase().includes(inChatSearch.toLowerCase())
  );

  const emojis = ['👍', '🎉', '🚀', '🔥', '❤️', '👏', '⚡', '💻', '🔒', '📶', '🙌', '✨'];

  return (
    <div className="h-[calc(100vh-8.5rem)] glass-panel rounded-3xl border border-border/70 overflow-hidden flex shadow-2xl relative">
      {/* Left Pane: Conversation List */}
      <div
        className={`${
          showMobileList ? 'flex' : 'hidden md:flex'
        } w-full md:w-80 lg:w-96 border-r border-border/70 flex-col bg-card/40 z-10`}
      >
        {/* Search & Header */}
        <div className="p-4 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Channels & Direct</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {conversations.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversation..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingChats ? (
            // Skeleton loader for chats
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-2xl flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-2 bg-muted rounded w-36" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    setShowMobileList(false);
                  }}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={conv.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.name || 'group'}`}
                        alt={conv.name || 'Chat'}
                        className="w-10 h-10 rounded-xl bg-muted object-cover ring-2 ring-border/40"
                      />
                      {conv.type === 'GROUP' ? (
                        <UsersRound className="w-3.5 h-3.5 absolute -bottom-1 -right-1 p-0.5 rounded-full bg-indigo-600 text-white ring-2 ring-card" />
                      ) : (
                        <Circle className="w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-emerald-500 ring-2 ring-card rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{conv.name || 'Chat'}</div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-[10px] ${
                        isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                    {conv.unreadCount > 0 && !isActive && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat Interface */}
      {activeConversation ? (
        <div
          className={`${
            showMobileList ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-background/50`}
        >
          {/* Header */}
          <div className="h-16 px-4 md:px-6 border-b border-border/70 flex items-center justify-between glass-panel-subtle">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <img
                src={activeConversation.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeConversation.name}`}
                alt={activeConversation.name || 'Chat'}
                className="w-10 h-10 rounded-xl bg-muted object-cover ring-2 ring-border/50"
              />
              <div>
                <h3 className="font-bold text-sm leading-tight">{activeConversation.name}</h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                    <Circle className="w-2 h-2 fill-emerald-500" />
                    Subnet Peer Live
                  </span>
                  <span>•</span>
                  <span>{activeConversation.type === 'GROUP' ? 'Group Channel' : 'Direct P2P Link'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                className={`p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors ${
                  showInChatSearch ? 'bg-muted text-primary' : 'hover:bg-muted'
                }`}
                title="Search Messages"
              >
                <Search className="w-4 h-4" />
              </button>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 font-mono text-muted-foreground hidden sm:inline-block">
                Socket: 8080
              </span>
            </div>
          </div>

          {/* In-Chat Search Bar */}
          {showInChatSearch && (
            <div className="p-3 bg-muted/40 border-b border-border/50 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input
                type="text"
                value={inChatSearch}
                onChange={(e) => setInChatSearch(e.target.value)}
                placeholder="Search words in this conversation..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-card border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => {
                  setInChatSearch('');
                  setShowInChatSearch(false);
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {displayedMessages.map((msg) => {
              const isMine = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-lg bg-muted object-cover mb-1"
                    />
                  )}

                  <div className={`max-w-[85%] sm:max-w-md ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && (
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 block pl-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-border/60 text-foreground rounded-bl-sm'
                      }`}
                    >
                      {/* Attached File Preview inside Message */}
                      {msg.fileTransfer && (
                        <div className="mb-2 p-2.5 rounded-xl bg-background/20 border border-border/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {msg.fileTransfer.fileType === 'IMAGE' ? (
                              <ImageIcon className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-cyan-400" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate">{msg.fileTransfer.originalName}</p>
                              <p className="text-[10px] opacity-80">
                                {(msg.fileTransfer.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileService.downloadFile(msg.fileTransfer!.id, msg.fileTransfer!.originalName)}
                            className="p-1.5 rounded-lg bg-card/60 hover:bg-card text-foreground transition-all"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <p>{msg.content}</p>

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          <span>
                            {msg.status === 'READ' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTypingSimulated && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                <span>{activeConversation.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Floating Picker */}
          {showEmojiPicker && (
            <div className="px-6 pb-2 flex items-center gap-2 flex-wrap bg-background/70 backdrop-blur-sm p-2 border-t border-border/50">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 hover:bg-muted rounded-lg text-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Typing Input Box */}
          <div className="p-4 border-t border-border/70 glass-panel-subtle">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Attach local file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Insert Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeConversation.name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-40 transition-all active:scale-95"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 stroke-[1] mb-3 opacity-40" />
          <h3 className="font-bold text-foreground text-sm">Select a conversation</h3>
          <p className="text-xs mt-1 max-w-sm">
            Choose a channel or direct message from the left list to collaborate over your local network.
          </p>
        </div>
      )}
    </div>
  );
};
