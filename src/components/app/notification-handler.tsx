"use client"

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { getMessaging, isSupported } from 'firebase/messaging';
import { requestNotificationPermission, setupForegroundNotificationListener } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';

export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isMessagingSupported, setIsMessagingSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if messaging is supported
    isSupported().then((supported) => {
      setIsMessagingSupported(supported);

      if (supported && typeof window !== 'undefined') {
        setNotificationPermission(Notification.permission);

        // Show prompt if permission is default and user hasn't dismissed it
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (Notification.permission === 'default' && !dismissed) {
          setShowPrompt(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!user || !isMessagingSupported) return;

    const setupNotifications = async () => {
      try {
        const messaging = getMessaging();

        // Setup foreground message listener
        setupForegroundNotificationListener(messaging);

        // If permission already granted, update token
        if (Notification.permission === 'granted') {
          await requestNotificationPermission(messaging, user.uid, firestore);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [user, firestore, isMessagingSupported]);

  const handleEnableNotifications = async () => {
    if (!user || !isMessagingSupported) return;

    try {
      const messaging = getMessaging();
      const token = await requestNotificationPermission(messaging, user.uid, firestore);

      if (token) {
        setNotificationPermission('granted');
        setShowPrompt(false);
        localStorage.removeItem('notification-prompt-dismissed');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!showPrompt || !isMessagingSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 max-w-sm">
      <Card className="shadow-2xl border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Activer les notifications</CardTitle>
              <CardDescription className="text-sm">
                Restez informé des activités importantes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Nouvelles dépenses et rapports</li>
            <li>• Missions terminées et assignées</li>
            <li>• Ajouts de budget</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={handleEnableNotifications} className="flex-1">
              <Bell className="mr-2 h-4 w-4" />
              Activer
            </Button>
            <Button onClick={handleDismiss} variant="outline" className="flex-1">
              <BellOff className="mr-2 h-4 w-4" />
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
