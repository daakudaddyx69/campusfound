import React, { useState } from 'react';
import { MapPin, Calendar, User, CheckCircle2, Trash2, MessageSquare, Tag, ShieldCheck } from 'lucide-react';
import { LostItem, FoundItem } from '../types';

interface ItemCardProps {
  key?: string;
  item: LostItem | FoundItem;
  type: 'lost' | 'found';
  currentUserId?: string;
  onResolve: (id: string, type: 'lost' | 'found') => void;
  onDelete: (id: string, type: 'lost' | 'found') => void;
  onContactOwner: (item: LostItem | FoundItem, type: 'lost' | 'found') => void;
}

export default function ItemCard({
  item,
  type,
  currentUserId,
  onResolve,
  onDelete,
  onContactOwner,
}: ItemCardProps) {
  const isOwner = currentUserId === item.userId;
  const isResolved = item.status === 'resolved';
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const badgeConfig = {
    lost: {
      active: { bg: 'border-red-600/30 text-red-500 bg-red-950/20', text: 'Lost' },
      resolved: { bg: 'border-white/15 text-white/40 bg-zinc-900', text: 'Returned to Owner' },
    },
    found: {
      active: { bg: 'border-blue-500/30 text-blue-400 bg-blue-950/20', text: 'Found' },
      resolved: { bg: 'border-white/15 text-white/40 bg-zinc-900', text: 'Claimed & Resolved' },
    },
  };

  const currentBadge = isResolved 
    ? badgeConfig[type].resolved 
    : badgeConfig[type].active;

  return (
    <article 
      className={`relative flex flex-col justify-between overflow-hidden border bg-zinc-900/60 p-6 transition-all duration-300 ${
        isResolved 
          ? 'opacity-60 border-white/5' 
          : 'border-white/10 hover:border-red-600/40'
      }`}
      id={`item-card-${item.id}`}
    >
      {/* Top indicator bar */}
      <div className={`absolute top-0 right-0 left-0 h-[3px] ${
        isResolved 
          ? 'bg-zinc-800' 
          : type === 'lost' 
            ? 'bg-red-600' 
            : 'bg-blue-500'
      }`} />

      <div>
        {/* Header: Title and Status Tag */}
        <div className="flex items-start justify-between gap-4 mt-2">
          <h3 className="font-extrabold text-white text-base tracking-tight uppercase font-sans line-clamp-1 hover:line-clamp-none transition-all">
            {item.title}
          </h3>
          <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase ${currentBadge.bg}`}>
            {isResolved && <ShieldCheck className="h-2.5 w-2.5" />}
            {currentBadge.text}
          </span>
        </div>

        {/* Categories, Dates & Metadata */}
        <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2 text-[10px] text-white/50 font-medium font-mono">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5">
            <Tag className="h-3 w-3 text-white/40" />
            <span className="uppercase tracking-wider">{item.category}</span>
          </div>

          <div className="flex items-center gap-1 text-white/50 bg-white/5 border border-white/5 px-2 py-0.5">
            <MapPin className="h-3 w-3 text-red-500/80" />
            <span className="line-clamp-1 uppercase tracking-wider" title={item.location}>{item.location}</span>
          </div>

          <div className="flex items-center gap-1 text-white/50 bg-white/5 border border-white/5 px-2 py-0.5">
            <Calendar className="h-3 w-3 text-white/40" />
            <span className="uppercase tracking-wider">{type === 'lost' ? (item as LostItem).dateLost : (item as FoundItem).dateFound}</span>
          </div>
        </div>

        {/* Content body description */}
        <p className="mt-4 text-xs text-white/60 leading-relaxed min-h-[40px] whitespace-pre-wrap break-words line-clamp-3 font-sans">
          {item.description}
        </p>
      </div>

      {/* Footer Details: Poster metadata & CTA buttons */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <div className="flex h-7 w-7 items-center justify-center border border-white/25 bg-white/5 text-white text-[11px] font-extrabold uppercase italic">
              {item.userName ? item.userName.charAt(0) : <User className="h-3 w-3" />}
            </div>
            <div className="flex flex-col">
              <span className="text-white/95 font-bold line-clamp-1 leading-tight">{item.userName || 'Student'}</span>
              <span className="text-[9px] text-white/40 tracking-wider uppercase font-normal line-clamp-1">{item.userEmail}</span>
            </div>
          </div>

          <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-mono whitespace-nowrap self-end">
            Posted {item.createdAt && typeof item.createdAt.toDate === 'function' ? new Date(item.createdAt.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="mt-4 flex gap-2" id={`item-actions-${item.id}`}>
          {isOwner ? (
            showConfirmDelete ? (
              <div className="flex flex-1 gap-2 w-full items-center">
                <button
                  id={`btn-confirm-delete-${item.id}`}
                  onClick={() => {
                    onDelete(item.id, type);
                    setShowConfirmDelete(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white border-none px-3 py-2.5 text-xs font-black uppercase tracking-widest font-mono transition-colors duration-150 cursor-pointer active:scale-98"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete?</span>
                </button>
                <button
                  id={`btn-cancel-delete-${item.id}`}
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex items-center justify-center border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-widest transition duration-150 cursor-pointer active:scale-98"
                >
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <>
                {!isResolved && (
                  <button
                    id={`btn-resolve-${item.id}`}
                    onClick={() => onResolve(item.id, type)}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-white text-[#0A0A0A] hover:bg-red-600 hover:text-white hover:border-red-600 border-none px-3 py-2.5 text-xs font-black uppercase tracking-widest font-mono transition-colors duration-150 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                )}
                <button
                  id={`btn-delete-${item.id}`}
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center justify-center border border-red-500/20 bg-red-950/20 hover:bg-red-600 hover:text-white px-3 py-2.5 text-xs font-bold text-red-500 transition duration-150 cursor-pointer active:scale-98"
                  title="Delete Post"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )
          ) : (
            currentUserId && (
              <button
                id={`btn-contact-${item.id}`}
                onClick={() => onContactOwner(item, type)}
                className={`flex w-full items-center justify-center gap-2 border py-2.5 text-xs font-bold font-mono uppercase tracking-widest transition duration-200 cursor-pointer active:scale-98 ${
                  isResolved
                    ? 'border-white/5 bg-zinc-800/40 text-white/20 cursor-not-allowed'
                    : type === 'lost'
                      ? 'border-red-600/30 text-red-400 bg-red-950/15 hover:bg-red-600 hover:text-white hover:border-red-600'
                      : 'border-blue-500/30 text-blue-400 bg-blue-950/15 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                }`}
                disabled={isResolved}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{type === 'lost' ? 'Contact Owner' : 'Contact Finder'}</span>
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
