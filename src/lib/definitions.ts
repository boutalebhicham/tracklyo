export type Currency = 'EUR' | 'USD' | 'XOF';
export type TransactionType = 'BUDGET_ADD' | 'EXPENSE';
export type RecapType = 'DAILY' | 'WEEKLY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Changed from UserRole to string
  avatar: string;
  phoneNumber: string;
}

export interface Project {
  id: string;
  name: string;
  authorId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  authorId: string;
  // projectId: string;
  amount: number;
  reason: string;
  date: string;
  type: TransactionType;
  currency: Currency;
}

export interface Recap {
  id:string;
  authorId: string;
  // projectId: string;
  title: string;
  type: RecapType;
  description: string;
  date: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface Comment {
  id: string;
  recapId: string;
  authorId: string;
  // projectId: string;
  content: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  authorId: string;
  // projectId: string;
  title: string;
  description: string;
  date: string; // ISO string for datetime
}

export interface DocumentFile {
  id: string;
  authorId: string;
  // projectId: string;
  name: string;
  type: string; // e.g., 'PDF', 'Image'
  date: string;
  size: string; // e.g., '2.5MB'
}
