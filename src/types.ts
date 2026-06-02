import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: Timestamp;
}

export interface LostItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateLost: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'lost' | 'resolved';
  createdAt: Timestamp;
}

export interface FoundItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'found' | 'resolved';
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  itemId: string;
  itemTitle: string;
  itemType: 'lost' | 'found';
  text: string;
  createdAt: Timestamp;
}
