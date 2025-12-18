"use client"

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Service worker is registered in the app layout
export const requestNotificationPermission = async (
  messaging: Messaging,
  userId: string,
  firestore: Firestore
): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('FCM Token:', token);

        // Save token to Firestore
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          fcmToken: token
        });

        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error);
    return null;
  }
};

export const setupForegroundNotificationListener = (messaging: Messaging) => {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);

    // Show notification when app is in foreground
    if (payload.notification) {
      const notificationTitle = payload.notification.title || 'Nouvelle notification';
      const notificationOptions = {
        body: payload.notification.body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: payload.data
      };

      // Check if browser supports notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
      }
    }
  });
};

export const getNotificationMessage = (
  type: string,
  data: Record<string, any>
): { title: string; body: string } => {
  switch (type) {
    case 'EXPENSE_ADDED':
      return {
        title: '💰 Nouvelle dépense',
        body: `${data.userName} a enregistré une dépense de ${data.amount} ${data.currency}: ${data.reason}`
      };
    case 'RECAP_ADDED':
      return {
        title: '📋 Nouveau rapport',
        body: `${data.userName} a publié un rapport d'activité: ${data.title}`
      };
    case 'MISSION_COMPLETED':
      return {
        title: '✅ Mission terminée',
        body: `${data.userName} a terminé la mission: ${data.missionTitle}`
      };
    case 'MISSION_ASSIGNED':
      return {
        title: '🎯 Nouvelle mission',
        body: `Vous avez une nouvelle mission: ${data.missionTitle}`
      };
    case 'BUDGET_ADDED':
      return {
        title: '💵 Budget ajouté',
        body: `${data.amount} ${data.currency} ont été ajoutés à votre budget`
      };
    case 'MISSION_REMINDER':
      return {
        title: '⏰ Rappel de mission',
        body: `La mission "${data.missionTitle}" arrive bientôt à échéance`
      };
    default:
      return {
        title: 'Notification',
        body: 'Vous avez une nouvelle notification'
      };
  }
};
