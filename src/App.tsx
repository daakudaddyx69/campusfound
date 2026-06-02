/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Info, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Inbox,
  UserCheck2,
  FileCheck2,
  Lock,
  MessageSquare,
  HelpCircle,
  Tag,
  Sparkles
} from 'lucide-react';

import { auth, db, loginWithGoogle, OperationType, handleFirestoreError } from './lib/firebase';
import { LostItem, FoundItem, Message } from './types';
import Navbar from './components/Navbar';
import ItemCard from './components/ItemCard';
import MessageCenter from './components/MessageCenter';
import PostDialog from './components/PostDialog';

const CATEGORIES = [
  'All Categories',
  'Electronics & Gadgets',
  'Keys, Badges & ID Cards',
  'Bags, Backpacks & Purses',
  'Wallets, Cards & Cash',
  'Books, Stationery & Notebooks',
  'Clothing, Shoes & Accessories',
  'Water Bottles & Flasks',
  'Sports & Gym Equipment',
  'Other Campus Belongings',
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'my-posts' | 'messages'>('lost');

  // Firestore Real-time Collections Data
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [messagesSender, setMessagesSender] = useState<Message[]>([]);
  const [messagesReceiver, setMessagesReceiver] = useState<Message[]>([]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showResolved, setShowResolved] = useState(false);

  // Posting Item Modals Model
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<'lost' | 'found'>('lost');

  // Contact owner selected parameters (for routing into chats with pre-defined selection)
  const [contactItemId, setContactItemId] = useState<string | null>(null);
  const [contactPartnerId, setContactPartnerId] = useState<string | null>(null);

  // Authentication monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
      
      if (firebaseUser) {
        // Handle pre-login tab redirect
        const savedTab = sessionStorage.getItem('pre_login_tab');
        if (savedTab === 'lost' || savedTab === 'found') {
          setActiveTab(savedTab as 'lost' | 'found');
          sessionStorage.removeItem('pre_login_tab');
        }

        // Automatically sync profile document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (!docSnap.exists()) {
            setDoc(userDocRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Campus Student',
              email: firebaseUser.email || '',
              createdAt: serverTimestamp(),
            }).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, 'users/' + firebaseUser.uid);
            });
          } else {
            const currentData = docSnap.data();
            const targetName = firebaseUser.displayName || 'Campus Student';
            const targetEmail = firebaseUser.email || '';
            if (currentData.name !== targetName || currentData.email !== targetEmail) {
              updateDoc(userDocRef, {
                name: targetName,
                email: targetEmail,
              }).catch(err => {
                handleFirestoreError(err, OperationType.UPDATE, 'users/' + firebaseUser.uid);
              });
            }
          }
        }).catch(err => {
          handleFirestoreError(err, OperationType.GET, 'users/' + firebaseUser.uid);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listeners subscription for active users
  useEffect(() => {
    if (!user) {
      setLostItems([]);
      setFoundItems([]);
      setMessagesSender([]);
      setMessagesReceiver([]);
      return;
    }

    const lostUnsub = onSnapshot(
      query(collection(db, 'lost_items'), where('status', 'in', ['lost', 'resolved'])),
      (snapshot) => {
        const items: LostItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as LostItem);
        });
        items.sort((a, b) => {
          const tA = a.createdAt ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setLostItems(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'lost_items');
      }
    );

    const foundUnsub = onSnapshot(
      query(collection(db, 'found_items'), where('status', 'in', ['found', 'resolved'])),
      (snapshot) => {
        const items: FoundItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as FoundItem);
        });
        items.sort((a, b) => {
          const tA = a.createdAt ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setFoundItems(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'found_items');
      }
    );

    const qSender = query(collection(db, 'messages'), where('senderId', '==', user.uid));
    const senderUnsub = onSnapshot(
      qSender,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Message);
        });
        setMessagesSender(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'messages_sender');
      }
    );

    const qReceiver = query(collection(db, 'messages'), where('receiverId', '==', user.uid));
    const receiverUnsub = onSnapshot(
      qReceiver,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Message);
        });
        setMessagesReceiver(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'messages_receiver');
      }
    );

    return () => {
      lostUnsub();
      foundUnsub();
      senderUnsub();
      receiverUnsub();
    };
  }, [user]);

  // Merge & Sort Messages cleanly for Chat Center (oldest first for individual threads)
  const combinedMessages = useMemo(() => {
    const merged = [...messagesSender, ...messagesReceiver];
    const uniqueMap = new Map<string, Message>();
    merged.forEach(m => {
      if (m.id) uniqueMap.set(m.id, m);
    });
    const uniqueArr = Array.from(uniqueMap.values());
    return uniqueArr.sort((a, b) => {
      const tA = a.createdAt ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt ? b.createdAt.toMillis() : 0;
      return tA - tB;
    });
  }, [messagesSender, messagesReceiver]);

  // Dynamic Metrics counts
  const stats = useMemo(() => {
    const totalLost = lostItems.length;
    const resolvedLost = lostItems.filter(i => i.status === 'resolved').length;
    const totalFound = foundItems.length;
    const resolvedFound = foundItems.filter(i => i.status === 'resolved').length;

    return {
      activeLost: totalLost - resolvedLost,
      resolvedTotal: resolvedLost + resolvedFound,
      activeFound: totalFound - resolvedFound
    };
  }, [lostItems, foundItems]);

  // Unread messages indicator check
  const unreadMessagesCount = useMemo(() => {
    // Basic counter: count messages where receiver is me and sender is other user (unique thread last messages)
    // To keep it simple, we count absolute incoming messages count stored or we show any interactive notification
    return messagesReceiver.length;
  }, [messagesReceiver]);

  // Handle post submit creation
  const handleCreatePost = async (data: {
    title: string;
    description: string;
    category: string;
    location: string;
    date: string;
  }) => {
    if (!user) return;

    const collectionName = postModalType === 'lost' ? 'lost_items' : 'found_items';
    try {
      const docRef = doc(collection(db, collectionName));
      const payload = {
        id: docRef.id,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        [postModalType === 'lost' ? 'dateLost' : 'dateFound']: data.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Campus Student',
        status: postModalType === 'lost' ? 'lost' : 'found',
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    }
  };

  // Handle marking item solved
  const handleResolveItem = async (id: string, type: 'lost' | 'found') => {
    const collectionName = type === 'lost' ? 'lost_items' : 'found_items';
    try {
      await updateDoc(doc(db, collectionName, id), {
        status: 'resolved'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  // Handle deleting reported post
  const handleDeleteItem = async (id: string, type: 'lost' | 'found') => {
    const collectionName = type === 'lost' ? 'lost_items' : 'found_items';
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  // Handle clicking "Contact Owner" / "Contact Finder"
  const handleContactOwner = (item: LostItem | FoundItem, type: 'lost' | 'found') => {
    if (!user) return;
    
    // Save state on temporary session store to populate metadata for first draft message
    sessionStorage.setItem('draft_item_title', item.title);
    sessionStorage.setItem('draft_item_type', type);
    sessionStorage.setItem('draft_item_uname', item.userName || 'Student');
    sessionStorage.setItem('draft_item_uemail', item.userEmail);

    setContactItemId(item.id);
    setContactPartnerId(item.userId);
    setActiveTab('messages');
  };

  // Handle dispatching messages in real time
  const handleSendMessage = async (receiverId: string, itemId: string, itemTitle: string, itemType: 'lost' | 'found', text: string) => {
    if (!user) return;

    try {
      const msgRef = doc(collection(db, 'messages'));
      await setDoc(msgRef, {
        id: msgRef.id,
        senderId: user.uid,
        senderName: user.displayName || 'Campus Student',
        senderEmail: user.email,
        receiverId,
        itemId,
        itemTitle,
        itemType,
        text,
        createdAt: serverTimestamp(),
      });

      // Clear selection triggers because conversation has successfully registered
      setContactItemId(null);
      setContactPartnerId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  const openPostModal = (type: 'lost' | 'found') => {
    setPostModalType(type);
    setPostModalOpen(true);
  };

  // Filtering Logic
  const filteredLostItems = useMemo(() => {
    return lostItems.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
      const matchesStatus = showResolved || item.status === 'lost';
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [lostItems, searchQuery, selectedCategory, showResolved]);

  const filteredFoundItems = useMemo(() => {
    return foundItems.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
      const matchesStatus = showResolved || item.status === 'found';
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [foundItems, searchQuery, selectedCategory, showResolved]);

  const myPosts = useMemo(() => {
    if (!user) return [];
    const myLost = lostItems.filter(item => item.userId === user.uid).map(i => ({ ...i, type: 'lost' as const }));
    const myFound = foundItems.filter(item => item.userId === user.uid).map(i => ({ ...i, type: 'found' as const }));
    return [...myLost, ...myFound].sort((a, b) => {
      const tA = a.createdAt ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
  }, [lostItems, foundItems, user]);

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-white flex font-sans" id="app-root-container">
      {/* Vertical Branding Rail */}
      <div className="hidden lg:flex w-20 border-r border-white/10 flex-col items-center justify-between py-12 shrink-0">
        <div className="rotate-[-90deg] whitespace-nowrap text-[9px] tracking-[0.4em] font-bold uppercase opacity-30 origin-center translate-y-12 font-mono">
          Campus Utility Service
        </div>
        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
        <div className="rotate-[-90deg] whitespace-nowrap text-[9px] tracking-[0.4em] font-bold uppercase opacity-30 origin-center -translate-y-12 font-mono">
          Portal V.2.04
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Headliner Navbar */}
        <Navbar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          unreadCount={unreadMessagesCount}
          onOpenPostModal={openPostModal}
        />

        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          {loadingAuth ? (
            <div className="flex flex-col items-center justify-center py-20" id="loading-spinner">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-red-600" />
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mt-6">Connecting to Campus Portal...</p>
            </div>
          ) : !user ? (
            /* Landing Screen for anonymous visitors styled with the signature brutalist Bold Typography spec */
            <div className="py-8 md:py-16 max-w-4xl mx-auto" id="landing-screen">
              {/* Left Column Bold Display Headings */}
              <div className="space-y-8">
                <header className="relative">
                  <h2 className="text-[54px] sm:text-[76px] lg:text-[110px] leading-[0.85] font-black tracking-tighter uppercase text-white">
                    Misplaced<br/>
                    <span className="text-red-600 italic">Items</span>
                  </h2>
                  <div className="mt-6 text-sm text-white/40 font-bold uppercase tracking-widest font-mono max-w-md">
                    Centralized Repository V.2.04 • Safe Retrievals
                  </div>
                </header>

                <p className="text-sm text-white/50 leading-relaxed max-w-xl font-sans">
                  The official secure matching and communications database for personal gear, devices, stationery, keys, and water flasks lost or tracked down inside the university campus. Connect with student credentials to list reports.
                </p>

                {/* Direct Options Grids inspired by Design spec */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('pre_login_tab', 'lost');
                      loginWithGoogle();
                    }} 
                    className="group bg-[#0A0A0A] p-8 text-left hover:bg-white hover:text-[#0A0A0A] transition-all duration-300 rounded-none cursor-pointer"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-4 font-mono">Option 01</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-black transition-colors">I lost something</h3>
                    <p className="mt-3 text-xs text-white/40 group-hover:text-black/60 transition-colors leading-relaxed">Connect credentials & file a report for a missing personal belonging.</p>
                  </button>
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('pre_login_tab', 'found');
                      loginWithGoogle();
                    }} 
                    className="group bg-[#0A0A0A] p-8 text-left hover:bg-red-600 hover:text-white transition-all duration-300 rounded-none cursor-pointer"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 font-mono">Option 02</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-white transition-colors">I found something</h3>
                    <p className="mt-3 text-xs text-white/60 leading-relaxed">Log recovered access cards, tags, keys, or accessories.</p>
                  </button>
                </div>

                {/* Notice Block */}
                <div className="border border-white/5 bg-white/5 p-5 font-mono max-w-xl">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-red-600 mb-2">Notice</div>
                  <p className="text-[10px] leading-relaxed text-white/50 font-sans">
                    End users must present verified key identifiers or clear physical description cards to authorize claim requests.
                  </p>
                </div>

                {/* Footer Micro-Stats block with custom metrics */}
                <div className="flex flex-wrap justify-end items-end border-t border-white/10 pt-8 mt-12 gap-6">
                  <div className="text-[9px] uppercase tracking-[0.25em] text-white/35 font-bold font-mono">
                    Secured University Asset Portal
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full Dashboard when logged in */
            <div className="space-y-8" id="dashboard-hub">
            
            {/* Quick stats mini ribbon formatted of raw borders inspired by design specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10" id="dashboard-metric-cards">
              <div className="bg-[#0A0A0A] p-6.5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Active Lost Item Reports</span>
                <span className="block text-4xl font-black text-white mt-2 font-mono">{stats.activeLost}</span>
              </div>

              <div className="bg-[#0A0A0A] p-6.5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Reported Items Found</span>
                <span className="block text-4xl font-black text-white mt-2 font-mono">{stats.activeFound}</span>
              </div>

              <div className="bg-[#0A0A0A] p-6.5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Resolved / Returned Count</span>
                <span className="block text-4xl font-black text-red-600 mt-2 font-mono">{stats.resolvedTotal}</span>
              </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'messages' ? (
              <MessageCenter
                messages={combinedMessages}
                currentUserId={user.uid}
                currentUserEmail={user.email || ''}
                currentUserName={user.displayName || 'Campus Student'}
                onSendMessage={handleSendMessage}
                initialSelectedItemId={contactItemId}
                initialSelectedPartnerId={contactPartnerId}
              />
            ) : activeTab === 'my-posts' ? (
              /* Reported Items view for current student */
              <div className="space-y-6" id="my-posts-tab">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/15 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">My Campus Submissions</h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wider font-mono mt-0.5">Edit or mark your lost/found items resolved when returned.</p>
                  </div>
                </div>

                {myPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-white/40 bg-zinc-950 border border-dashed border-white/10" id="my-posts-fallback">
                    <AlertCircle className="h-10 w-10 text-red-600 mb-4" />
                    <p className="font-extrabold text-white uppercase tracking-widest text-xs font-mono">No campus posts submitted yet</p>
                    <p className="text-xs text-white/40 mt-1 max-w-sm leading-relaxed">Use the Report or Log action items in the top navigation bar to create active listings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="my-posts-grid">
                    {myPosts.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        type={item.type}
                        currentUserId={user.uid}
                        onResolve={handleResolveItem}
                        onDelete={handleDeleteItem}
                        onContactOwner={handleContactOwner}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Main lists view (Lost Items or Found Items with general query feeds) */
              <div className="space-y-8" id="main-catalog-feed">
                {/* Search, Filter Bar inside clean stark design container */}
                <div className="bg-zinc-950 border border-white/10 p-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Field */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-4 h-4 w-4 text-white/40" />
                      <input
                        id="catalog-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items by keywords, specifications, or campus location..."
                        className="w-full bg-[#0A0A0A] text-white border border-white/15 focus:border-red-600 focus:ring-0 focus:outline-none pl-11 pr-4 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition rounded-none placeholder-white/20"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="w-full md:w-72 relative">
                      <select
                        id="catalog-category-filter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-[#0A0A0A] text-white border border-white/15 focus:border-red-600 focus:ring-0 focus:outline-none px-4 py-3.5 text-xs font-mono font-black uppercase tracking-widest transition rounded-none appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-zinc-900 text-white">
                            {cat.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sub-Filters: Show resolved checkbox */}
                  <div className="flex items-center justify-between text-xs gap-3 font-mono font-bold text-white/40">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none hover:text-white transition-colors">
                      <input
                        id="toggle-show-resolved"
                        type="checkbox"
                        checked={showResolved}
                        onChange={(e) => setShowResolved(e.target.checked)}
                        className="h-4 w-4 rounded-none bg-[#0A0A0A] border border-white/20 text-red-600 focus:ring-0 cursor-pointer checked:bg-red-600"
                      />
                      <span className="uppercase tracking-wider">Show claimed / resolved archives</span>
                    </label>

                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                      Showing {activeTab === 'lost' ? filteredLostItems.length : filteredFoundItems.length} records found
                    </div>
                  </div>
                </div>

                {/* Main list components */}
                <div id="catalog-listing-grid">
                  {activeTab === 'lost' ? (
                    filteredLostItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center text-white/40 bg-zinc-950 border border-dashed border-white/10">
                        <Inbox className="h-10 w-10 text-white/30 mb-4" />
                        <p className="font-bold text-white uppercase tracking-widest text-xs font-mono">No matching lost reports</p>
                        <p className="text-xs text-white/40 mt-1 max-w-xs leading-relaxed">Adjust your matching search keys or choose another category category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLostItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            type="lost"
                            currentUserId={user.uid}
                            onResolve={handleResolveItem}
                            onDelete={handleDeleteItem}
                            onContactOwner={handleContactOwner}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    filteredFoundItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center text-white/40 bg-zinc-950 border border-dashed border-white/10">
                        <Inbox className="h-10 w-10 text-white/30 mb-4" />
                        <p className="font-bold text-white uppercase tracking-widest text-xs font-mono">No matching found records</p>
                        <p className="text-xs text-white/40 mt-1 max-w-xs leading-relaxed">Adjust your matching search keys or choose another category category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFoundItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            type="found"
                            currentUserId={user.uid}
                            onResolve={handleResolveItem}
                            onDelete={handleDeleteItem}
                            onContactOwner={handleContactOwner}
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* Posting Modal */}
      <PostDialog
        type={postModalType}
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handleCreatePost}
      />
      </div>
    </div>
  );
}
