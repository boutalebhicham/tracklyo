

export type Currency = 'EUR' | 'USD' | 'XOF';
export type TransactionType = 'BUDGET_ADD' | 'EXPENSE';
export type PaymentMethod = 'CASH' | 'CARD' | 'WAVE' | 'ORANGE_MONEY';
export type RecapType = 'DAILY' | 'WEEKLY';
export type UserRole = 'PATRON' | 'RESPONSABLE';
export type MissionStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type MissionType = 'PERSONAL' | 'SHARED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phoneNumber: string;
  managerId?: string; // ID of the PATRON
  fcmToken?: string; // Firebase Cloud Messaging token for push notifications
}

export type AddUserForm = Omit<User, 'id' | 'role' | 'avatar' | 'managerId' | 'phoneNumber'> & {
  password?: string;
};

export interface Transaction {
  id: string;
  authorId: string;
  amount: number;
  reason: string;
  date: string;
  type: TransactionType;
  currency: Currency;
  paymentMethod?: PaymentMethod;
}

export interface Recap {
  id:string;
  authorId: string;
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
  content: string;
  date: string;
}

export interface Event {
  id: string;
  authorId: string;
  title: string;
  description: string;
  date: string; // ISO string for datetime
}

export interface DocumentFile {
  id: string;
  authorId: string;
  name: string;
  type: string; // e.g., 'PDF', 'Image'
  date: string;
  size: string; // e.g., '2.5MB'
}

// Alias for compatibility
export type Document = DocumentFile;

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface CalendarEvent {
  id: string;
  authorId: string;
  title: string;
  date: string;
  description?: string;
}

export interface Mission {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  status: MissionStatus;
  type: MissionType;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'EXPENSE_ADDED'
  | 'RECAP_ADDED'
  | 'MISSION_COMPLETED'
  | 'MISSION_ASSIGNED'
  | 'BUDGET_ADDED'
  | 'MISSION_REMINDER';

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>; // Additional data for the notification
}
