import React from 'react';
import { LogIn, LogOut, User, Search, MapPin, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { loginWithGoogle, logout } from '../lib/firebase';

interface NavbarProps {
  user: FirebaseUser | null;
  activeTab: 'lost' | 'found' | 'my-posts' | 'messages';
  setActiveTab: (tab: 'lost' | 'found' | 'my-posts' | 'messages') => void;
  unreadCount: number;
  onOpenPostModal: (type: 'lost' | 'found') => void;
}

export default function Navbar({
  user,
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenPostModal,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 sm:h-20 lg:h-24 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('lost')} 
          className="flex cursor-pointer items-center gap-2 sm:gap-3 transition active:scale-95 shrink-0"
          id="navbar-brand"
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center border-2 border-red-600 bg-red-600 text-white font-mono font-black text-xs sm:text-lg">
            F
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-black tracking-tighter uppercase text-white">
              CampusFound<span className="text-red-600">.</span>
            </h1>
            <p className="hidden sm:block text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase mt-0.5 font-mono">UTILITY PORTAL</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="hidden lg:flex items-center gap-6 shrink-0 whitespace-nowrap" id="navbar-navigation-tabs">
            <button
              id="tab-lost-btn"
              onClick={() => setActiveTab('lost')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === 'lost'
                  ? 'text-white border-b-2 border-red-650'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Lost Items
            </button>
            <button
              id="tab-found-btn"
              onClick={() => setActiveTab('found')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === 'found'
                  ? 'text-white border-b-2 border-red-650'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Found Items
            </button>
            <button
              id="tab-my-posts-btn"
              onClick={() => setActiveTab('my-posts')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === 'my-posts'
                  ? 'text-white border-b-2 border-red-650'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              My Posts
            </button>
            <button
              id="tab-messages-btn"
              onClick={() => setActiveTab('messages')}
              className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === 'messages'
                  ? 'text-white border-b-2 border-red-650'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white font-mono animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
          </nav>
        )}

        {/* User Auth Info & Quick Post Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0" id="navbar-auth-actions">
          {user ? (
            <>
              {/* Quick Post Button */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  id="action-post-lost"
                  onClick={() => onOpenPostModal('lost')}
                  className="flex items-center gap-1 border border-white/10 hover:border-red-600 hover:bg-red-600 text-white rounded-none uppercase text-[9px] sm:text-[10px] tracking-widest font-bold font-mono px-2 py-1.5 sm:px-3 sm:py-2 transition-colors duration-200 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  title="Report Lost Item"
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Report Lost</span>
                  <span className="inline sm:hidden">Lost</span>
                </button>
                <button
                  id="action-post-found"
                  onClick={() => onOpenPostModal('found')}
                  className="flex items-center gap-1 border border-white/10 hover:border-red-600 hover:bg-red-600 text-white rounded-none uppercase text-[9px] sm:text-[10px] tracking-widest font-bold font-mono px-2 py-1.5 sm:px-3 sm:py-2 transition-colors duration-200 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  title="Log Found Item"
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Log Found</span>
                  <span className="inline sm:hidden">Found</span>
                </button>
              </div>

              {/* User Identity Info */}
              <div className="hidden lg:flex flex-col text-right items-end mr-1 font-mono">
                <span className="text-xs font-bold text-white line-clamp-1">{user.displayName || 'Campus Student'}</span>
                <span className="text-[9px] text-white/40 tracking-wider uppercase line-clamp-1">{user.email}</span>
              </div>

              {/* User Initials Avatar badge */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 border border-white/20 flex items-center justify-center text-[9px] sm:text-[10px] font-bold italic text-white rounded-none shrink-0">
                {user.displayName ? user.displayName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase() : 'JS'}
              </div>

              {/* Sign out */}
              <button
                id="navbar-signout-btn"
                onClick={logout}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border border-white/10 hover:border-white/20 text-white/40 hover:text-white bg-[#0A0A0A] hover:bg-zinc-900 transition duration-150 cursor-pointer active:scale-95 shrink-0"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={loginWithGoogle}
              className="flex items-center gap-2 border border-white/20 bg-white text-[#0A0A0A] hover:bg-red-600 hover:text-white hover:border-red-650 px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest font-mono transition-colors duration-250 cursor-pointer active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Connect Badge</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      {user && (
        <div className="grid lg:hidden border-t border-white/10 bg-[#0A0A0A] grid-cols-4 text-center text-[10px] py-3 font-bold uppercase tracking-wider text-white/50">
          <button
            onClick={() => setActiveTab('lost')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'lost' ? 'text-white font-black' : ''}`}
          >
            <span>Lost Items</span>
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'found' ? 'text-white font-black' : ''}`}
          >
            <span>Found Items</span>
          </button>
          <button
            onClick={() => setActiveTab('my-posts')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'my-posts' ? 'text-white font-black' : ''}`}
          >
            <span>My Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-0.5 relative ${activeTab === 'messages' ? 'text-white font-black' : ''}`}
          >
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-4 h-1.5 w-1.5 rounded-full bg-red-600 ring-1 ring-[#0a0a0a] animate-pulse" />
            )}
          </button>
        </div>
      )}
    </header>
  );
}
