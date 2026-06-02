import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Tag, User, Clock, ArrowLeft } from 'lucide-react';
import { Message } from '../types';

interface MessageCenterProps {
  messages: Message[];
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  onSendMessage: (receiverId: string, itemId: string, itemTitle: string, itemType: 'lost' | 'found', text: string) => Promise<void>;
  initialSelectedItemId?: string | null;
  initialSelectedPartnerId?: string | null;
}

export default function MessageCenter({
  messages,
  currentUserId,
  currentUserEmail,
  currentUserName,
  onSendMessage,
  initialSelectedItemId,
  initialSelectedPartnerId,
}: MessageCenterProps) {
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages into distinct conversations
  // Key format: itemId_partnerId
  const threadsMap = new Map<string, {
    itemId: string;
    itemTitle: string;
    itemType: 'lost' | 'found';
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    messages: Message[];
    lastTimestamp: Date;
  }>();

  messages.forEach((msg) => {
    const isSender = msg.senderId === currentUserId;
    const partnerId = isSender ? msg.receiverId : msg.senderId;
    const partnerName = isSender ? 'Owner / Contact' : msg.senderName; // we will resolve the best name below
    const partnerEmail = isSender ? '' : msg.senderEmail; 

    const threadKey = `${msg.itemId}_${partnerId}`;

    if (!threadsMap.has(threadKey)) {
      threadsMap.set(threadKey, {
        itemId: msg.itemId,
        itemTitle: msg.itemTitle,
        itemType: msg.itemType,
        partnerId,
        partnerName: isSender ? 'Owner / Finder' : msg.senderName, // default fallback
        partnerEmail: isSender ? 'Direct Contact' : msg.senderEmail,
        messages: [],
        lastTimestamp: msg.createdAt && typeof msg.createdAt.toDate === 'function' ? msg.createdAt.toDate() : new Date(),
      });
    }

    const currentThread = threadsMap.get(threadKey)!;
    currentThread.messages.push(msg);

    // Overwrite partner metadata if we find a record where the other person was the sender (gives accurate name/email)
    if (!isSender) {
      currentThread.partnerName = msg.senderName;
      currentThread.partnerEmail = msg.senderEmail;
    }

    // Sort to keep newest lastMessage updated
    const msgDate = msg.createdAt && typeof msg.createdAt.toDate === 'function' ? msg.createdAt.toDate() : new Date();
    if (msgDate > currentThread.lastTimestamp) {
      currentThread.lastTimestamp = msgDate;
    }
  });

  // Convert map to array and sort threads by latest message timestamp
  const threads = Array.from(threadsMap.entries()).map(([key, value]) => {
    // Sort this specific thread's messages chronologically
    value.messages.sort((a, b) => {
      const tA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
      return tA - tB;
    });
    return { key, ...value };
  }).sort((a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime());

  // Handle outside activation (e.g. from item card "Contact Owner" trigger)
  useEffect(() => {
    if (initialSelectedItemId && initialSelectedPartnerId) {
      const matchKey = `${initialSelectedItemId}_${initialSelectedPartnerId}`;
      
      // If thread already exists, navigate to it
      if (threadsMap.has(matchKey)) {
        setActiveThreadKey(matchKey);
      } else {
        // If thread does not exist yet (first message being initiated),
        // we'll find if any mock or actual item exists to register
        setActiveThreadKey(matchKey);
      }
    } else if (threads.length > 0 && !activeThreadKey) {
      // Default select the first active thread
      setActiveThreadKey(threads[0].key);
    }
  }, [initialSelectedItemId, initialSelectedPartnerId, messages.length]);

  // Scroll to bottom when active chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadKey, messages.length]);

  // Handle active thread details
  const activeThread = activeThreadKey ? threads.find(t => t.key === activeThreadKey) : null;
  const activeMessages = activeThread ? activeThread.messages : [];

  // Special scenario: First message draft (not in firestore threads list yet)
  const isDraftThread = activeThreadKey && !threadsMap.has(activeThreadKey) && initialSelectedItemId;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadKey) return;

    setSending(true);
    try {
      // Extract target metadata
      let receiverId = '';
      let itemId = '';
      let itemTitle = 'Inquired Item';
      let itemType: 'lost' | 'found' = 'lost';

      if (isDraftThread && initialSelectedItemId && initialSelectedPartnerId) {
        receiverId = initialSelectedPartnerId;
        itemId = initialSelectedItemId;
        // In this case, we have fallback item details passed in query state or we extract from metadata
        const storageTitle = sessionStorage.getItem('draft_item_title') || 'Item';
        const storageType = sessionStorage.getItem('draft_item_type') as 'lost' | 'found' || 'lost';
        itemTitle = storageTitle;
        itemType = storageType;
      } else if (activeThread) {
        receiverId = activeThread.partnerId;
        itemId = activeThread.itemId;
        itemTitle = activeThread.itemTitle;
        itemType = activeThread.itemType;
      }

      if (receiverId && itemId) {
        await onSendMessage(receiverId, itemId, itemTitle, itemType, inputText.trim());
        setInputText('');
      }
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    } finally {
      setSending(false);
    }
  };

  const getPartnerLabel = (email: string) => {
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return 'Campus Student';
  };

  return (
    <div className="grid h-[calc(100vh-12rem)] max-h-[700px] grid-cols-1 overflow-hidden border border-white/10 bg-[#0A0A0A] md:grid-cols-12" id="message-center-panels">
      
      {/* Threads Sidebar (cols 1-4) */}
      <div className={`col-span-1 border-r border-white/10 bg-zinc-950/40 flex flex-col md:col-span-4 ${activeThreadKey ? 'hidden md:flex' : 'flex'}`} id="message-sidebar">
        <div className="border-b border-white/10 bg-zinc-950 p-5">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <MessageSquare className="h-4.5 w-4.5 text-red-600" />
            <span>Chat Box Inbox</span>
          </h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-mono mt-1">Discuss meetups safely</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
          {threads.length === 0 && !isDraftThread ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white/30">
              <MessageSquare className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider font-mono">No active discussions</p>
              <p className="text-[10px] text-white/40 mt-1 max-w-[200px] leading-relaxed">Click &quot;Contact Owner&quot; on any item listing to negotiate returns.</p>
            </div>
          ) : (
            <>
              {/* Draft Thread Node */}
              {isDraftThread && initialSelectedPartnerId && (
                <button
                  onClick={() => setActiveThreadKey(`${initialSelectedItemId}_${initialSelectedPartnerId}`)}
                  className="w-full text-left p-4.5 bg-red-600/10 border border-red-600/35 flex flex-col gap-1 border-l-4 border-l-red-600"
                >
                  <div className="flex items-center justify-between text-xs text-red-500 font-bold font-mono uppercase tracking-widest">
                    <span>New Discussion...</span>
                    <span className="h-2 w-2 rounded-full bg-red-650" />
                  </div>
                  <h4 className="text-xs font-black text-white truncate mt-1">
                    {sessionStorage.getItem('draft_item_title') || 'Inquiry'}
                  </h4>
                  <p className="text-[10px] text-white/40 truncate mt-1 italic font-mono font-medium">Type below to start chatting!</p>
                </button>
              )}

              {/* Standard active threads */}
              {threads.map((thread) => {
                const isActive = thread.key === activeThreadKey;
                const lastMsg = thread.messages[thread.messages.length - 1];
                
                return (
                  <button
                    key={thread.key}
                    onClick={() => setActiveThreadKey(thread.key)}
                    className={`w-full text-left p-4.5 flex flex-col gap-1 transition-all duration-200 cursor-pointer rounded-none border-b border-white/5 ${
                      isActive 
                        ? 'bg-red-600/10 text-white border-l-4 border-l-red-600'
                        : 'bg-[#0A0A0A] hover:bg-zinc-900 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold font-mono ${
                        thread.itemType === 'lost' ? 'bg-orange-600/20 text-orange-400' : 'bg-emerald-600/20 text-emerald-400'
                      }`}>
                        <Tag className="h-2 w-2" />
                        {thread.itemType.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-white/30 font-mono">
                        {lastMsg && lastMsg.createdAt && typeof lastMsg.createdAt.toDate === 'function' ? new Date(lastMsg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-white tracking-tight truncate mt-1.5">
                      {thread.itemTitle.toUpperCase()}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-mono mt-1">
                      <div className="flex h-4 w-4 items-center justify-center bg-white/10 text-[8px] font-black uppercase text-white">
                        {thread.partnerName.charAt(0)}
                      </div>
                      <span className="truncate">{thread.partnerName}</span>
                    </div>

                    {lastMsg && (
                      <p className="text-[11px] text-white/40 line-clamp-1 mt-1 font-sans">
                        {lastMsg.senderId === currentUserId ? 'You: ' : ''}{lastMsg.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Message Chat Room (cols 5-12) */}
      <div className={`col-span-1 flex flex-col bg-zinc-950 md:col-span-8 ${!activeThreadKey ? 'hidden md:flex' : 'flex'}`} id="message-chat-window">
        {activeThreadKey ? (
          <>
            {/* Conversations Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveThreadKey(null)}
                  className="block md:hidden text-white/40 hover:text-white border border-white/10 p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      {isDraftThread ? sessionStorage.getItem('draft_item_title') : activeThread?.itemTitle}
                    </h3>
                    <span className={`inline-flex items-center gap-1 py-0.5 px-1.5 text-[8px] font-bold font-mono ${
                      (isDraftThread ? (sessionStorage.getItem('draft_item_type') || 'lost') : activeThread?.itemType) === 'lost'
                        ? 'bg-orange-655/20 text-orange-400'
                        : 'bg-emerald-655/20 text-emerald-400'
                    }`}>
                      {(isDraftThread ? (sessionStorage.getItem('draft_item_type') || 'lost') : activeThread?.itemType)?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40 font-mono">
                    <User className="h-3 w-3 text-red-650" />
                    <span>
                      {isDraftThread 
                        ? (sessionStorage.getItem('draft_item_uname') || 'Owner') 
                        : activeThread?.partnerName} 
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="lowercase font-normal">
                      {isDraftThread 
                        ? (sessionStorage.getItem('draft_item_uemail') || 'Direct') 
                        : activeThread?.partnerEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chats Messages Log */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-5 space-y-4 flex flex-col">
              {activeMessages.length === 0 && (
                <div className="my-auto flex flex-col items-center justify-center p-6 text-center text-white/40">
                  <div className="p-4 border border-white/10 bg-white/5">
                    <MessageSquare className="h-8 w-8 text-red-600 animate-pulse" />
                  </div>
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-widest mt-4">Start Campus Meetup Chat</h4>
                  <p className="text-[11px] text-white/40 font-sans mt-1 leading-relaxed max-w-[280px]">
                    Discuss details about the item such as identification proof, meeting points, or campus collection spot.
                  </p>
                </div>
              )}

              {activeMessages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col max-w-[80%] p-4 text-xs border ${
                      isMe
                        ? 'self-end bg-red-600/10 text-white border-red-600/30'
                        : 'self-start bg-zinc-900 text-white/90 border-white/15'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed break-words font-sans">{msg.text}</p>
                    <span className="block text-[8px] font-bold text-white/30 text-right mt-2 uppercase tracking-widest font-mono">
                      {msg.createdAt && typeof msg.createdAt.toDate === 'function' ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} className="border-t border-white/10 p-4 bg-zinc-950 flex gap-3 items-center" id="message-send-form">
              <input
                id="message-text-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Suggest a safe student spot (e.g. Library Desk or Cafe)..."
                className="flex-1 bg-[#0A0A0A] text-white border border-white/15 focus:border-red-600 focus:ring-0 focus:outline-none px-4 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition rounded-none placeholder-white/20"
                disabled={sending}
                maxLength={1000}
              />
              <button
                id="btn-send-message"
                type="submit"
                disabled={sending || !inputText.trim()}
                className="flex h-11 px-6 items-center justify-center bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase text-[10px] tracking-widest transition disabled:opacity-50 cursor-pointer rounded-none active:scale-95 shrink-0"
              >
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white/30 bg-[#0A0A0A]" id="chat-fallback">
            <MessageSquare className="h-12 w-12 text-white/10" />
            <h3 className="mt-3 text-xs font-bold text-white uppercase tracking-widest font-mono">Campus Message Center</h3>
            <p className="mt-1.5 text-xs text-white/40 max-w-[280px] leading-relaxed">
              Select or open an active conversation to coordinate return checkouts, confirm student credentials, or review physical descriptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
