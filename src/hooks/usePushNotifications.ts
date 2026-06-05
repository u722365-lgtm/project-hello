import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isSupported) {
        if (!silent) {
          toast({
            title: 'Not Supported',
            description: 'Push notifications are not supported in your browser',
            variant: 'destructive',
          });
        }
        return false;
      }

      try {
        // Avoid re-prompting when already decided.
        if (Notification.permission === "denied") {
          setPermission("denied");
          return false;
        }
        if (Notification.permission === "granted") {
          setPermission("granted");
          return true;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (silent) return result === "granted";

        if (result === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You will receive notifications when back online',
          });
          return true;
        }

        toast({
          title: 'Notifications Blocked',
          description: 'Enable notifications in browser settings',
          variant: 'destructive',
        });
        return false;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    },
    [isSupported, toast],
  );

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const notifyOnlineStatus = useCallback(() => {
    sendNotification('Back Online!', {
      body: 'Your connection has been restored. Messages will now sync.',
      tag: 'online-status',
    });
  }, [sendNotification]);

  const notifyMessagesSynced = useCallback((count: number) => {
    if (count === 0) return;
    
    sendNotification('Messages Synced', {
      body: `${count} message${count > 1 ? 's have' : ' has'} been synced.`,
      tag: 'messages-synced',
    });
  }, [sendNotification]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (permission === 'granted') {
        notifyOnlineStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [permission, notifyOnlineStatus]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyOnlineStatus,
    notifyMessagesSynced,
  };
};
