import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string | null;
}

export function NotificationDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications-drawer')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    const data = notification.data as Record<string, unknown> | null;
    const href = typeof data?.href === 'string' ? data.href : null;
    const internalHref =
      href && href.startsWith('/') && !href.startsWith('//') ? href : null;

    if (internalHref) {
      navigate(internalHref);
      setIsOpen(false);
    } else if (notification.type === 'journey_step_cleared') {
      navigate('/worker/journey');
      setIsOpen(false);
    } else if (data?.job_id) {
      navigate(`/jobs/${data.job_id}`);
      setIsOpen(false);
    } else if (data?.application_id) {
      navigate('/employer/applications');
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer_accepted':
        return <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">✓</div>;
      case 'offer_rejected':
        return <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">✗</div>;
      case 'new_application':
        return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">📄</div>;
      case 'interview_scheduled':
        return <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">📅</div>;
      case 'message':
        return <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">💬</div>;
      case 'journey_step_cleared':
        return <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">✓</div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">🔔</div>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'offer_accepted':
        return 'Offer';
      case 'offer_rejected':
        return 'Offer';
      case 'new_application':
        return 'Application';
      case 'interview_scheduled':
        return 'Interview';
      case 'message':
        return 'Message';
      case 'journey_step_cleared':
        return 'Journey';
      default:
        return 'Update';
    }
  };

  if (!user) return null;

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </DrawerTitle>
              <DrawerDescription>
                Stay updated with your latest activity
              </DrawerDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">New</h4>
                  <div className="space-y-2">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="group relative flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer transition-all"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Badge variant="outline" className="mb-1 text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <p className="font-semibold text-sm">
                                {notification.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-primary rounded-full absolute top-4 right-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div>
                  {unreadNotifications.length > 0 && <Separator className="my-4" />}
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h4>
                  <div className="space-y-2">
                    {readNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="group relative flex gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-all"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Badge variant="outline" className="mb-1 text-xs opacity-60">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <p className="font-medium text-sm text-muted-foreground">
                                {notification.title}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-2">
                            {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DrawerFooter className="border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default NotificationDrawer;
